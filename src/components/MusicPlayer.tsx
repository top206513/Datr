import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import clsx from 'clsx'
import { TRACKS } from '@/data/tracks'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { formatClock } from '@/lib/time'

const RANGE_CLASSES =
  'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent ' +
  '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent ' +
  '[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ' +
  '[&::-webkit-slider-thumb]:bg-gold-300 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(240,196,121,0.8)] [&::-webkit-slider-thumb]:-mt-1 ' +
  '[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold-300 ' +
  '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent'

/** Пять полосок-эквалайзера; «замирают», когда музыка на паузе. */
function Visualizer({ active }: { active: boolean }) {
  return (
    <span aria-hidden className="flex h-5 items-end gap-[3px]">
      {[0.9, 0.45, 1, 0.6, 0.75].map((scale, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-linear-to-t from-wine-500 to-gold-300"
          animate={
            active
              ? { height: [`${18 * scale}%`, `${100 * scale}%`, `${34 * scale}%`] }
              : { height: '16%' }
          }
          transition={
            active
              ? { duration: 0.9 + i * 0.17, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
              : { duration: 0.3 }
          }
          style={{ height: '16%' }}
        />
      ))}
    </span>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-4 shrink-0 fill-none stroke-mist-500 stroke-[1.6]"
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

function IconButton({
  label,
  onClick,
  children,
  primary,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        'grid place-items-center rounded-full transition active:scale-95',
        primary
          ? 'size-12 bg-linear-to-br from-wine-400 to-gold-400 text-night-950 shadow-glow hover:brightness-110'
          : 'size-9 border border-white/12 bg-white/5 text-mist-100 hover:border-gold-400/50 hover:text-gold-300',
      )}
    >
      {children}
    </button>
  )
}

export function MusicPlayer() {
  const player = useAudioPlayer(TRACKS)
  const [open, setOpen] = useState(false)

  const progress = player.duration > 0 ? (player.position / player.duration) * 100 : 0

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="pointer-events-auto mx-auto w-full max-w-4xl">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 16, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="glass-strong mb-2 rounded-2xl p-3">
                <p className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-[0.22em] text-gold-400/80">
                  Плейлист вечера
                </p>
                <ul className="flex flex-col gap-1">
                  {TRACKS.map((track, i) => {
                    const current = i === player.index
                    return (
                      <li key={track.id}>
                        <button
                          type="button"
                          onClick={() => player.select(i)}
                          className={clsx(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                            current ? 'bg-white/10' : 'hover:bg-white/5',
                          )}
                        >
                          <span
                            className={clsx(
                              'w-5 shrink-0 text-center text-xs tabular-nums',
                              current ? 'text-gold-300' : 'text-mist-500',
                            )}
                          >
                            {current && player.isPlaying ? '▶' : i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={clsx(
                                'block truncate text-sm',
                                current ? 'text-mist-100' : 'text-mist-300',
                              )}
                            >
                              {track.title}
                            </span>
                            <span className="block truncate text-[11px] text-mist-500">
                              {track.mood}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-mist-500">
                            {formatClock(track.duration)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <p className="px-3 pb-1 pt-3 text-[11px] leading-relaxed text-mist-500">
                  Треки синтезируются прямо в браузере — ничего не загружается и работает офлайн.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-strong rounded-2xl px-3.5 py-3 sm:px-5">
          {/* Прогресс-бар */}
          <div className="mb-3 flex items-center gap-3">
            <span className="w-9 shrink-0 text-[11px] tabular-nums text-mist-500">
              {formatClock(player.position)}
            </span>

            <div className="relative flex-1">
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-wine-500 to-gold-400 transition-[width] duration-150 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={player.duration}
                step={1}
                value={Math.floor(player.position)}
                onChange={(e) => player.seek(Number(e.target.value))}
                aria-label="Перемотка трека"
                className={clsx('relative', RANGE_CLASSES)}
              />
            </div>

            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-mist-500">
              {formatClock(player.duration)}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Visualizer active={player.isPlaying} />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="min-w-0 flex-1 text-left"
              aria-expanded={open}
              aria-label="Показать плейлист"
            >
              <span className="block truncate font-display text-lg leading-tight text-mist-100">
                {player.track.title}
              </span>
              <span className="block truncate text-[11px] text-mist-500">
                {player.unsupported ? 'Звук недоступен в этом браузере' : player.track.mood}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <IconButton label="Предыдущий трек" onClick={player.prev}>
                <span aria-hidden>⏮</span>
              </IconButton>

              <IconButton
                label={player.isPlaying ? 'Пауза' : 'Играть'}
                onClick={player.toggle}
                primary
              >
                <span aria-hidden className="text-lg leading-none">
                  {player.isPlaying ? '❙❙' : '▶'}
                </span>
              </IconButton>

              <IconButton label="Следующий трек" onClick={player.next}>
                <span aria-hidden>⏭</span>
              </IconButton>
            </div>

            {/* Громкость — только на широких экранах */}
            <div className="hidden w-28 items-center gap-2 md:flex">
              <VolumeIcon muted={player.volume === 0} />
              <div className="relative flex-1">
                <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-mist-300/70"
                    style={{ width: `${player.volume * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={player.volume}
                  onChange={(e) => player.changeVolume(Number(e.target.value))}
                  aria-label="Громкость"
                  className={clsx('relative', RANGE_CLASSES)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Свернуть плейлист' : 'Развернуть плейлист'}
              className="grid size-8 shrink-0 place-items-center rounded-full text-mist-500 transition hover:text-gold-300"
            >
              <motion.span animate={{ rotate: open ? 180 : 0 }} aria-hidden>
                ⌃
              </motion.span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
