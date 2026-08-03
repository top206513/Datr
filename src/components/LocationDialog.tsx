import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { CATEGORY_META } from '@/data/locations'
import { Rating } from '@/components/ui/Rating'
import type { DateLocation } from '@/types'

interface LocationDialogProps {
  location: DateLocation | null
  chosen: boolean
  favorite: boolean
  onClose: () => void
  onChoose: (id: string) => void
  onToggleFavorite: (id: string) => void
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-3">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-mist-500">{label}</dt>
      <dd className="mt-1 text-sm text-mist-100">{value}</dd>
    </div>
  )
}

export function LocationDialog({
  location,
  chosen,
  favorite,
  onClose,
  onChoose,
  onToggleFavorite,
}: LocationDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!location) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [location, onClose])

  useEffect(() => {
    setCopied(false)
  }, [location])

  const coords = location ? `${location.coords.lat.toFixed(5)}, ${location.coords.lng.toFixed(5)}` : ''

  const copyCoords = async () => {
    if (!location) return
    try {
      await navigator.clipboard.writeText(coords)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* Буфер обмена недоступен — координаты и так видны на экране. */
    }
  }

  return (
    <AnimatePresence>
      {location && (
        <motion.div
          className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0 bg-night-950/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-dialog-title"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl2 sm:rounded-xl2"
          >
            <div className="relative overflow-hidden px-6 pb-6 pt-7 sm:px-9 sm:pt-9">
              <div
                aria-hidden
                className={clsx(
                  'absolute -top-28 left-1/3 h-52 w-[80%] rounded-full bg-linear-to-br opacity-30 blur-3xl',
                  CATEGORY_META[location.category].accent,
                )}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-400/85">
                      <span aria-hidden>{CATEGORY_META[location.category].icon}</span>
                      {CATEGORY_META[location.category].label}
                    </p>
                    <h3
                      id="location-dialog-title"
                      className="mt-2 font-display text-3xl leading-tight text-mist-100 sm:text-4xl"
                    >
                      {location.name}
                    </h3>
                    <p className="mt-1 text-sm text-mist-500">{location.area}</p>
                  </div>

                  <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-mist-300 transition hover:bg-white/12 hover:text-mist-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Rating value={location.rating} size="md" />
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(location.id)}
                    aria-pressed={favorite}
                    className={clsx(
                      'rounded-full border px-3.5 py-1.5 text-xs transition',
                      favorite
                        ? 'border-wine-400/60 bg-wine-500/20 text-wine-300'
                        : 'border-white/15 text-mist-300 hover:border-wine-400/50 hover:text-wine-300',
                    )}
                  >
                    {favorite ? '♥ В избранном' : '♡ В избранное'}
                  </button>
                </div>

                <p className="mt-6 text-[15px] leading-relaxed text-mist-100/90">
                  {location.description}
                </p>

                <div className="mt-5 rounded-2xl border border-gold-400/25 bg-gold-400/[0.07] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">Совет</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mist-100/90">{location.tip}</p>
                </div>

                <dl className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <Detail label="Когда идти" value={location.bestTime} />
                  <Detail label="Сколько займёт" value={location.duration} />
                  <Detail label="Бюджет" value={location.price} />
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {location.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={copyCoords}
                  className="mt-5 flex items-center gap-2 text-xs text-mist-500 transition hover:text-gold-300"
                  title="Скопировать координаты"
                >
                  <span aria-hidden>📍</span>
                  <span className="tabular-nums">{coords}</span>
                  <span className={clsx('transition', copied ? 'text-gold-300' : 'text-mist-500/70')}>
                    {copied ? 'скопировано' : 'копировать'}
                  </span>
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-white/10 bg-night-900/85 px-6 py-4 backdrop-blur-xl sm:flex-row sm:px-9">
              <button
                type="button"
                onClick={() => onChoose(location.id)}
                className={clsx(
                  'flex-1 rounded-xl px-5 py-3 text-sm font-semibold transition',
                  chosen
                    ? 'bg-white/10 text-gold-300 hover:bg-white/15'
                    : 'bg-linear-to-r from-wine-500 to-gold-500 text-night-950 hover:brightness-110',
                )}
              >
                {chosen ? '✓ Это место свидания' : 'Выбрать местом свидания'}
              </button>

              <a
                href={`https://yandex.ru/maps/?pt=${location.coords.lng},${location.coords.lat}&z=16&l=map`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-medium text-mist-100 transition hover:border-gold-400/60 hover:text-gold-300"
              >
                Открыть в картах ↗
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
