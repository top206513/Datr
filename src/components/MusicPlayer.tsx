import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import clsx from 'clsx'
import { CupidMark } from '@/components/CupidMark'
import { TRACKS } from '@/data/tracks'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { formatClock } from '@/lib/time'

/** Ползунок: сам инпут прозрачен и лежит поверх нарисованной дорожки. */
const RANGE_CLASSES =
  'relative h-1.5 w-full cursor-pointer appearance-none bg-transparent ' +
  '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent ' +
  '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:-mt-[3px] ' +
  '[&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(93,44,52,0.5)] ' +
  '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white ' +
  '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent'

function Rail({ value, className }: { value: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-ink-900/12',
        className,
      )}
    >
      <span
        className="block h-full rounded-full bg-ink-900/60 transition-[width] duration-150 ease-linear"
        style={{ width: `${value}%` }}
      />
    </span>
  )
}

function PlayIcon({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx('fill-current', className)} aria-hidden>
      {playing ? (
        <path d="M8.5 5h2.2v14H8.5zM13.3 5h2.2v14h-2.2z" />
      ) : (
        <path d="M8 5.2v13.6a.6.6 0 0 0 .92.5l10.5-6.8a.6.6 0 0 0 0-1L8.92 4.7a.6.6 0 0 0-.92.5Z" />
      )}
    </svg>
  )
}

function SkipIcon({ back }: { back?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={clsx('size-[18px] fill-current', back && 'scale-x-[-1]')}
      aria-hidden
    >
      <path d="M5 6.4v11.2a.5.5 0 0 0 .77.42l8.4-5.6a.5.5 0 0 0 0-.84l-8.4-5.6A.5.5 0 0 0 5 6.4Z" />
      <rect x="16.4" y="5.6" width="2.4" height="12.8" rx="1.2" />
    </svg>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-[15px] shrink-0 fill-none stroke-ink-400 stroke-[1.6]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" />
      {muted ? (
        <>
          <path d="M16.5 9.8l4 4.4" />
          <path d="M20.5 9.8l-4 4.4" />
        </>
      ) : (
        <>
          <path d="M15.8 9.4a3.6 3.6 0 0 1 0 5.2" />
          <path d="M18.4 7.2a7 7 0 0 1 0 9.6" />
        </>
      )}
    </svg>
  )
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Плеер живёт в двух состояниях: свёрнутая «пилюля» (по умолчанию, чтобы
 * не перекрывать страницу) и развёрнутая карточка с перемоткой,
 * громкостью и плейлистом.
 */
export function MusicPlayer() {
  const player = useAudioPlayer(TRACKS)
  const [expanded, setExpanded] = useState(false)

  const progress = player.duration > 0 ? (player.position / player.duration) * 100 : 0
  const left = Math.max(0, player.duration - player.position)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-5 sm:pb-5"
      // На iPhone в режиме «с домашнего экрана» внизу живёт индикатор — не залезаем под него.
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* На широких экранах плеер прижат вправо, чтобы не спорить с текстом */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-6xl justify-center lg:justify-end">
        <motion.div layout transition={{ duration: 0.45, ease: EASE }} className="w-full sm:w-auto">
          <AnimatePresence mode="popLayout" initial={false}>
            {expanded ? (
              <motion.div
                key="card"
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="glass-floating w-full rounded-glass p-3 sm:w-[26rem] sm:p-4"
              >
                <div className="flex items-start gap-3.5">
                  <span className="glass-inset grid size-14 shrink-0 place-items-center rounded-2xl">
                    <CupidMark className="w-7 text-ink-900" weight={2.6} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-ink-900">
                      {player.track.title}
                    </p>
                    <p className="truncate text-[12px] text-ink-500">
                      {player.unsupported ? 'Звук недоступен в этом браузере' : player.track.mood}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    aria-label="Свернуть плеер"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-white/50 hover:text-ink-900"
                  >
                    <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
                      <path d="M5 9.5 12 15l7-5.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3.5 flex items-center gap-2.5">
                  <span className="w-8 shrink-0 text-[10px] tabular-nums text-ink-400">
                    {formatClock(player.position)}
                  </span>
                  <div className="relative flex-1">
                    <Rail value={progress} />
                    <input
                      type="range"
                      min={0}
                      max={player.duration}
                      step={1}
                      value={Math.floor(player.position)}
                      onChange={(e) => player.seek(Number(e.target.value))}
                      aria-label="Перемотка трека"
                      className={RANGE_CLASSES}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-ink-400">
                    −{formatClock(left)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex w-20 items-center gap-2">
                    <VolumeIcon muted={player.volume === 0} />
                    <div className="relative flex-1">
                      <Rail value={player.volume * 100} className="h-1" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={player.volume}
                        onChange={(e) => player.changeVolume(Number(e.target.value))}
                        aria-label="Громкость"
                        className={RANGE_CLASSES}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={player.prev}
                      aria-label="Предыдущий трек"
                      className="grid size-9 place-items-center rounded-full text-ink-700 transition duration-300 hover:bg-white/50 hover:text-ink-900 active:scale-90"
                    >
                      <SkipIcon back />
                    </button>
                    <button
                      type="button"
                      onClick={player.toggle}
                      aria-label={player.isPlaying ? 'Пауза' : 'Играть'}
                      className="grid size-11 place-items-center rounded-full bg-ink-900 text-cream-50 transition duration-300 hover:bg-ink-700 active:scale-90"
                    >
                      <PlayIcon playing={player.isPlaying} className="size-[18px]" />
                    </button>
                    <button
                      type="button"
                      onClick={player.next}
                      aria-label="Следующий трек"
                      className="grid size-9 place-items-center rounded-full text-ink-700 transition duration-300 hover:bg-white/50 hover:text-ink-900 active:scale-90"
                    >
                      <SkipIcon />
                    </button>
                  </div>

                  <div className="w-20" />
                </div>

                <ul className="mt-3 flex flex-col gap-0.5 border-t border-ink-900/8 pt-2.5">
                  {TRACKS.map((track, i) => {
                    const current = i === player.index
                    return (
                      <li key={track.id}>
                        <button
                          type="button"
                          onClick={() => player.select(i)}
                          className={clsx(
                            'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition duration-300',
                            current ? 'bg-white/60' : 'hover:bg-white/40',
                          )}
                        >
                          <span
                            className={clsx(
                              'w-3.5 shrink-0 text-center text-[10px] tabular-nums',
                              current ? 'text-ink-900' : 'text-ink-300',
                            )}
                          >
                            {current && player.isPlaying ? '▶' : i + 1}
                          </span>
                          <span
                            className={clsx(
                              'min-w-0 flex-1 truncate text-[13px]',
                              current ? 'font-medium text-ink-900' : 'text-ink-700',
                            )}
                          >
                            {track.title}
                          </span>
                          <span className="shrink-0 text-[10px] tabular-nums text-ink-300">
                            {formatClock(track.duration)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            ) : (
              <motion.div
                key="pill"
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="glass-floating relative flex items-center gap-2 overflow-hidden rounded-full py-1.5 pl-1.5 pr-2"
              >
                <button
                  type="button"
                  onClick={player.toggle}
                  aria-label={player.isPlaying ? 'Пауза' : 'Играть'}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900 text-cream-50 transition duration-300 hover:bg-ink-700 active:scale-90"
                >
                  <PlayIcon playing={player.isPlaying} className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  aria-expanded={false}
                  aria-label="Развернуть плеер"
                  className="min-w-0 flex-1 px-1 text-left sm:w-40 sm:flex-none"
                >
                  <span className="block truncate text-[13px] font-medium tracking-tight text-ink-900">
                    {player.track.title}
                  </span>
                  <span className="block truncate text-[11px] text-ink-400">
                    {player.isPlaying ? formatClock(player.position) : player.track.mood}
                  </span>
                </button>

                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[2px] bg-ink-900/50 transition-[width] duration-150 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
