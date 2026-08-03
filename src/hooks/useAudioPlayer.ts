import { useCallback, useEffect, useRef, useState } from 'react'
import { AmbientEngine } from '@/audio/engine'
import { STORAGE_KEYS, readState, writeState } from '@/lib/storage'
import type { Track } from '@/types'

export interface PlayerApi {
  track: Track
  index: number
  isPlaying: boolean
  position: number
  duration: number
  volume: number
  /** Web Audio недоступен — плеер показывается, но выключен */
  unsupported: boolean
  toggle: () => void
  next: () => void
  prev: () => void
  select: (index: number) => void
  seek: (seconds: number) => void
  changeVolume: (value: number) => void
}

export function useAudioPlayer(tracks: Track[]): PlayerApi {
  const engineRef = useRef<AmbientEngine | null>(null)
  if (engineRef.current === null) engineRef.current = new AmbientEngine()
  const engine = engineRef.current

  const [index, setIndex] = useState(0)
  const [isPlaying, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [volume, setVolume] = useState(() => readState<number>(STORAGE_KEYS.volume, 0.7))

  const track = tracks[Math.min(index, tracks.length - 1)]

  // Держим актуальный индекс в ref: onEnded вызывается из движка,
  // а не из React-рендера, и не должен ловить устаревшее значение.
  const indexRef = useRef(index)
  indexRef.current = index

  useEffect(() => {
    engine.setVolume(volume)
  }, [engine, volume])

  useEffect(() => {
    engine.setListeners({
      onPosition: setPosition,
      onEnded: () => {
        const nextIndex = (indexRef.current + 1) % tracks.length
        setIndex(nextIndex)
        engine.load(tracks[nextIndex], { autoplay: true })
        setPlaying(true)
      },
    })
  }, [engine, tracks])

  // Первый трек загружается молча: автозапуск звука браузер всё равно
  // заблокирует, поэтому воспроизведение начинается только по клику.
  // Дальнейшие переключения делает jump(), поэтому эффект — только на монтирование.
  useEffect(() => {
    engine.load(tracks[0])
    return () => engine.dispose()
  }, [engine, tracks])

  const toggle = useCallback(() => {
    engine.toggle()
    setPlaying(engine.isPlaying)
  }, [engine])

  const jump = useCallback(
    (nextIndex: number) => {
      const wasPlaying = engine.isPlaying
      const bounded = (nextIndex + tracks.length) % tracks.length
      setIndex(bounded)
      engine.load(tracks[bounded], { autoplay: wasPlaying })
      setPlaying(wasPlaying)
      setPosition(0)
    },
    [engine, tracks],
  )

  const next = useCallback(() => jump(indexRef.current + 1), [jump])

  /** Как в привычных плеерах: первое нажатие «назад» перематывает в начало. */
  const prev = useCallback(() => {
    if (engine.position > 3) {
      engine.seek(0)
      setPosition(0)
      return
    }
    jump(indexRef.current - 1)
  }, [engine, jump])

  const seek = useCallback(
    (seconds: number) => {
      engine.seek(seconds)
      setPosition(seconds)
    },
    [engine],
  )

  const changeVolume = useCallback((value: number) => {
    const bounded = Math.max(0, Math.min(1, value))
    setVolume(bounded)
    writeState(STORAGE_KEYS.volume, bounded)
  }, [])

  return {
    track,
    index,
    isPlaying,
    position,
    duration: track.duration,
    volume,
    unsupported: !engine.isSupported,
    toggle,
    next,
    prev,
    select: jump,
    seek,
    changeVolume,
  }
}
