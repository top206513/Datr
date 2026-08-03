import type { Track } from '@/types'

type Voice = 'pad' | 'bass' | 'lead' | 'bell'

interface NoteEvent {
  /** Время внутри трека, в секундах */
  t: number
  freq: number
  dur: number
  voice: Voice
  gain: number
}

interface ActiveNote {
  gain: GainNode
  stopAt: number
  stop: (when: number) => void
}

/** Детерминированный ГСЧ — один и тот же трек всегда звучит одинаково. */
function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Полутоны → частота относительно базовой ноты. */
function pitch(base: number, semitones: number): number {
  return base * Math.pow(2, semitones / 12)
}

/**
 * Разворачивает «партитуру» трека в плоский список нот.
 * Считается один раз при загрузке трека, поэтому перемотка на любую
 * секунду — это просто поиск по массиву, без пересчёта.
 */
export function buildScore(track: Track): NoteEvent[] {
  const beat = 60 / track.bpm
  const bar = beat * 4
  const bars = Math.ceil(track.duration / bar)
  const rand = seeded(hashString(track.id))
  const events: NoteEvent[] = []
  const phraseLength = Math.max(1, Math.floor(track.melody.length / 8))

  for (let b = 0; b < bars; b++) {
    const t0 = b * bar
    if (t0 >= track.duration) break

    const chord = track.progression[b % track.progression.length]
    // Последние такты затихают — трек заканчивается, а не обрывается.
    const tail = Math.min(1, (track.duration - t0) / (bar * 4))
    const fade = 0.35 + 0.65 * tail

    events.push({
      t: t0,
      freq: pitch(track.root / 2, chord[0]),
      dur: bar * 0.92,
      voice: 'bass',
      gain: 0.42 * fade,
    })

    chord.forEach((semitone, i) => {
      events.push({
        t: t0 + i * 0.05,
        freq: pitch(track.root, semitone),
        dur: bar * 1.04,
        voice: 'pad',
        gain: 0.2 * fade,
      })
    })

    // Первые два такта — только подложка: мелодия вступает позже.
    if (b >= 2) {
      const phraseBar = b % phraseLength
      for (let i = 0; i < 8; i++) {
        const note = track.melody[(phraseBar * 8 + i) % track.melody.length]
        if (note === null || note === undefined) continue
        events.push({
          t: t0 + (i * beat) / 2,
          freq: pitch(track.root * 2, note),
          dur: beat * 0.85,
          voice: 'lead',
          gain: 0.15 * fade,
        })
      }
    }

    if (rand() > 0.7) {
      const note = chord[Math.floor(rand() * chord.length)]
      events.push({
        t: t0 + bar * 0.5,
        freq: pitch(track.root * 4, note),
        dur: 2.6,
        voice: 'bell',
        gain: 0.05 * fade,
      })
    }
  }

  return events.sort((a, b) => a.t - b.t)
}

/** Импульсная характеристика для реверберации — «зал» из затухающего шума. */
function createReverbImpulse(ctx: AudioContext, seconds = 2.8, decay = 2.6): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * seconds)
  const impulse = ctx.createBuffer(2, length, rate)

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }

  return impulse
}

/** Шумовая подложка: дождь / шорох винила. */
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    // Простой фильтр первого порядка даёт «розовый» шум — мягче белого.
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.2
  }

  return buffer
}

const LOOKAHEAD = 0.4
const TICK_MS = 60

export interface EngineListeners {
  onPosition?: (position: number) => void
  onEnded?: () => void
}

/**
 * Синтезатор атмосферных треков поверх Web Audio API.
 * Ноты планируются небольшими окнами вперёд (lookahead), поэтому
 * play/pause/seek отзываются мгновенно и не «уезжают» по времени.
 */
export class AmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bus: GainNode | null = null
  private noise: { source: AudioBufferSourceNode; gain: GainNode } | null = null

  private track: Track | null = null
  private score: NoteEvent[] = []
  private cursor = 0

  private startedAt = 0
  private offset = 0
  private timer: number | null = null
  private active: ActiveNote[] = []

  private volume = 0.7
  private playing = false

  constructor(private listeners: EngineListeners = {}) {}

  get isPlaying(): boolean {
    return this.playing
  }

  /** Позиция внутри трека в секундах. */
  get position(): number {
    if (!this.ctx || !this.playing) return this.offset
    return Math.min(this.offset + (this.ctx.currentTime - this.startedAt), this.duration)
  }

  get duration(): number {
    return this.track?.duration ?? 0
  }

  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'AudioContext' in window
  }

  setListeners(listeners: EngineListeners): void {
    this.listeners = listeners
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    if (!this.isSupported) return null

    const ctx = new AudioContext()

    const master = ctx.createGain()
    master.gain.value = this.volume

    // Лёгкая компрессия — чтобы наложение голосов не клиппировало.
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.knee.value = 20
    limiter.ratio.value = 6
    limiter.attack.value = 0.006
    limiter.release.value = 0.25

    const bus = ctx.createGain()
    const dry = ctx.createGain()
    dry.gain.value = 0.78

    const wet = ctx.createGain()
    wet.gain.value = 0.42

    const reverb = ctx.createConvolver()
    reverb.buffer = createReverbImpulse(ctx)

    bus.connect(dry).connect(master)
    bus.connect(reverb).connect(wet).connect(master)
    master.connect(limiter).connect(ctx.destination)

    this.ctx = ctx
    this.master = master
    this.bus = bus

    return ctx
  }

  load(track: Track, { autoplay = false } = {}): void {
    const wasPlaying = this.playing
    this.stopAllNotes(true)
    this.stopNoise()
    this.stopTimer()

    this.track = track
    this.score = buildScore(track)
    this.offset = 0
    this.cursor = 0
    this.playing = false
    this.listeners.onPosition?.(0)

    if (autoplay || wasPlaying) void this.play()
  }

  async play(): Promise<void> {
    const ctx = this.ensureContext()
    if (!ctx || !this.track) return

    // Браузер запускает контекст только по жесту пользователя.
    if (ctx.state === 'suspended') await ctx.resume()

    if (this.offset >= this.duration) this.offset = 0

    this.startedAt = ctx.currentTime
    this.cursor = this.findCursor(this.offset)
    this.playing = true

    this.startNoise()
    this.startTimer()
  }

  pause(): void {
    if (!this.playing) return
    this.offset = this.position
    this.playing = false
    this.stopTimer()
    this.stopAllNotes(false)
    this.stopNoise()
    this.listeners.onPosition?.(this.offset)
  }

  toggle(): void {
    if (this.playing) this.pause()
    else void this.play()
  }

  seek(seconds: number): void {
    const target = Math.max(0, Math.min(seconds, this.duration))
    const wasPlaying = this.playing

    this.stopAllNotes(false)
    this.offset = target
    this.cursor = this.findCursor(target)
    this.listeners.onPosition?.(target)

    if (wasPlaying && this.ctx) {
      this.startedAt = this.ctx.currentTime
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02)
    }
  }

  dispose(): void {
    this.stopTimer()
    this.stopAllNotes(true)
    this.stopNoise()
    void this.ctx?.close()
    this.ctx = null
    this.master = null
    this.bus = null
  }

  // --- внутреннее -------------------------------------------------------

  private findCursor(position: number): number {
    let i = 0
    while (i < this.score.length && this.score[i].t < position) i++
    return i
  }

  private startTimer(): void {
    this.stopTimer()
    this.tick()
    this.timer = window.setInterval(() => this.tick(), TICK_MS)
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  private tick(): void {
    if (!this.ctx || !this.playing) return

    const position = this.position
    this.listeners.onPosition?.(position)

    if (position >= this.duration) {
      this.offset = this.duration
      this.playing = false
      this.stopTimer()
      this.stopNoise()
      this.listeners.onEnded?.()
      return
    }

    const horizon = position + LOOKAHEAD

    while (this.cursor < this.score.length && this.score[this.cursor].t < horizon) {
      const event = this.score[this.cursor]
      const when = this.startedAt + (event.t - this.offset)
      this.scheduleNote(event, Math.max(when, this.ctx.currentTime))
      this.cursor++
    }

    this.collectFinished()
  }

  private scheduleNote(event: NoteEvent, when: number): void {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus || !this.track) return

    const amp = ctx.createGain()
    amp.gain.value = 0

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'

    const oscillators: OscillatorNode[] = []
    let attack = 0.02
    let peak = event.gain

    switch (event.voice) {
      case 'pad': {
        filter.frequency.value = 1100
        filter.Q.value = 0.6
        attack = 1.1

        for (const detune of [-6, 7]) {
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = event.freq
          osc.detune.value = detune
          oscillators.push(osc)
        }

        const shimmer = ctx.createOscillator()
        shimmer.type = 'triangle'
        shimmer.frequency.value = event.freq * 2
        shimmer.detune.value = 4
        oscillators.push(shimmer)
        peak = event.gain * 0.6
        break
      }
      case 'bass': {
        filter.frequency.value = 320
        attack = 0.08

        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = event.freq
        oscillators.push(osc)

        const body = ctx.createOscillator()
        body.type = 'triangle'
        body.frequency.value = event.freq
        body.detune.value = -4
        oscillators.push(body)
        break
      }
      case 'lead': {
        filter.frequency.value = 2600
        filter.Q.value = 0.9
        attack = 0.05

        const osc = ctx.createOscillator()
        osc.type = this.track.lead
        osc.frequency.value = event.freq
        // Живая интонация: нота едва заметно «доезжает» до высоты.
        osc.detune.setValueAtTime(-14, when)
        osc.detune.linearRampToValueAtTime(0, when + 0.09)
        oscillators.push(osc)
        break
      }
      case 'bell': {
        filter.frequency.value = 4200
        attack = 0.005

        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = event.freq
        oscillators.push(osc)
        break
      }
    }

    const end = when + event.dur
    const sustainUntil = Math.max(when + attack, end - Math.min(0.6, event.dur * 0.5))

    amp.gain.setValueAtTime(0.0001, when)
    amp.gain.linearRampToValueAtTime(peak, when + attack)
    amp.gain.setValueAtTime(peak, sustainUntil)
    amp.gain.exponentialRampToValueAtTime(0.0001, end)

    for (const osc of oscillators) {
      osc.connect(filter)
      osc.start(when)
      osc.stop(end + 0.05)
    }

    filter.connect(amp).connect(bus)

    this.active.push({
      gain: amp,
      stopAt: end + 0.05,
      stop: (at: number) => {
        for (const osc of oscillators) {
          try {
            osc.stop(at)
          } catch {
            /* уже остановлен */
          }
        }
      },
    })
  }

  /** Гасит звучащие ноты: мягко при паузе, мгновенно при выгрузке. */
  private stopAllNotes(immediate: boolean): void {
    const ctx = this.ctx
    if (!ctx) {
      this.active = []
      return
    }

    const now = ctx.currentTime
    const release = immediate ? 0.01 : 0.12

    for (const note of this.active) {
      try {
        note.gain.gain.cancelScheduledValues(now)
        note.gain.gain.setTargetAtTime(0, now, release / 3)
      } catch {
        /* узел мог быть уже отключён */
      }
      note.stop(now + release)
    }

    this.active = []
  }

  private collectFinished(): void {
    const now = this.ctx?.currentTime ?? 0
    if (this.active.length < 48) return
    this.active = this.active.filter((note) => note.stopAt > now)
  }

  private startNoise(): void {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus || !this.track || this.noise) return
    if (this.track.texture <= 0) return

    const source = ctx.createBufferSource()
    source.buffer = createNoiseBuffer(ctx)
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1400
    filter.Q.value = 0.4

    // Медленная волна по срезу фильтра — шум «дышит», как настоящий дождь.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 420
    lfo.connect(lfoGain).connect(filter.frequency)

    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.gain.setTargetAtTime(this.track.texture * 0.075, ctx.currentTime, 1.2)

    source.connect(filter).connect(gain).connect(bus)
    source.start()
    lfo.start()

    this.noise = { source, gain }
  }

  private stopNoise(): void {
    const ctx = this.ctx
    if (!this.noise || !ctx) return

    const { source, gain } = this.noise
    this.noise = null

    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15)

    window.setTimeout(() => {
      try {
        source.stop()
        source.disconnect()
      } catch {
        /* уже остановлен */
      }
    }, 700)
  }
}
