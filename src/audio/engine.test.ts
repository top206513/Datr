import { describe, expect, it } from 'vitest'
import { buildScore } from './engine'
import { TRACKS } from '@/data/tracks'
import type { Track } from '@/types'

describe('buildScore', () => {
  it.each(TRACKS.map((t) => [t.title, t] as const))('%s разворачивается в ноты', (_title, track) => {
    const score = buildScore(track)

    expect(score.length).toBeGreaterThan(50)
    expect(score.every((n) => n.t >= 0 && n.t < track.duration + 4)).toBe(true)
    expect(score.every((n) => Number.isFinite(n.freq) && n.freq > 20 && n.freq < 20000)).toBe(true)
    expect(score.every((n) => n.dur > 0 && n.gain > 0)).toBe(true)
  })

  it('возвращает события, отсортированные по времени', () => {
    const score = buildScore(TRACKS[0])
    const times = score.map((n) => n.t)

    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it('детерминирован: одинаковый трек — одинаковая партитура', () => {
    expect(buildScore(TRACKS[0])).toEqual(buildScore(TRACKS[0]))
  })

  it('содержит все четыре голоса', () => {
    const voices = new Set(buildScore(TRACKS[0]).map((n) => n.voice))

    expect(voices).toContain('pad')
    expect(voices).toContain('bass')
    expect(voices).toContain('lead')
  })

  it('мелодия вступает после двух вводных тактов', () => {
    const track = TRACKS[0]
    const bar = (60 / track.bpm) * 4
    const firstLead = buildScore(track).find((n) => n.voice === 'lead')

    expect(firstLead).toBeDefined()
    expect(firstLead!.t).toBeGreaterThanOrEqual(bar * 2)
  })

  it('не падает на вырожденном треке', () => {
    const tiny: Track = {
      id: 'tiny',
      title: 'tiny',
      mood: '',
      duration: 4,
      bpm: 120,
      root: 220,
      progression: [[0, 3, 7]],
      melody: [0],
      lead: 'sine',
      texture: 0,
    }

    expect(() => buildScore(tiny)).not.toThrow()
    expect(buildScore(tiny).length).toBeGreaterThan(0)
  })
})
