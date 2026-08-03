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
    <div className="glass-inset rounded-2xl px-4 py-3">
      <dt className="text-[11px] font-medium text-ink-400">{label}</dt>
      <dd className="mt-1 text-[14px] leading-snug text-ink-900">{value}</dd>
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

  const coords = location
    ? `${location.coords.lat.toFixed(5)}, ${location.coords.lng.toFixed(5)}`
    : ''

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
          transition={{ duration: 0.28 }}
        >
          <div
            className="absolute inset-0 bg-ink-900/25 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-dialog-title"
            initial={{ y: 32, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-glass-lg sm:rounded-glass-lg"
          >
            <div className="px-6 pb-6 pt-7 sm:px-9 sm:pt-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow flex items-center gap-2">
                    <span aria-hidden>{CATEGORY_META[location.category].icon}</span>
                    {CATEGORY_META[location.category].label}
                  </p>
                  <h3
                    id="location-dialog-title"
                    className="mt-3 text-[2rem] leading-tight text-ink-900 sm:text-[2.5rem]"
                  >
                    {location.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-500">{location.area}</p>
                </div>

                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="glass-thin grid size-9 shrink-0 place-items-center rounded-full text-[13px] text-ink-700 transition hover:bg-white/80"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Rating value={location.rating} size="md" />
                <button
                  type="button"
                  onClick={() => onToggleFavorite(location.id)}
                  aria-pressed={favorite}
                  className={clsx(
                    'rounded-full px-4 py-1.5 text-[13px] font-medium transition duration-300',
                    favorite ? 'glass-active' : 'glass-thin text-ink-700 hover:bg-white/70',
                  )}
                >
                  {favorite ? '♥ В избранном' : '♡ В избранное'}
                </button>
              </div>

              <p className="mt-7 text-[15px] leading-relaxed text-ink-700">
                {location.description}
              </p>

              <div className="glass-inset mt-6 rounded-2xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  Совет
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-900">{location.tip}</p>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <Detail label="Когда идти" value={location.bestTime} />
                <Detail label="Сколько займёт" value={location.duration} />
                <Detail label="Бюджет" value={location.price} />
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {location.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/50 px-3 py-1 text-[12px] text-ink-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={copyCoords}
                className="mt-5 flex items-center gap-2 text-[12px] text-ink-400 transition hover:text-ink-900"
                title="Скопировать координаты"
              >
                <span className="tabular-nums">{coords}</span>
                <span>{copied ? '· скопировано' : '· копировать'}</span>
              </button>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-ink-900/8 bg-white/88 px-6 py-4 backdrop-blur-2xl sm:flex-row sm:px-9">
              <button
                type="button"
                onClick={() => onChoose(location.id)}
                className={clsx(
                  'flex-1 rounded-2xl px-5 py-3.5 text-[15px] font-medium transition duration-300 active:scale-[0.98]',
                  chosen
                    ? 'glass-thin text-ink-900 hover:bg-white/75'
                    : 'bg-ink-900 text-cream-50 hover:bg-ink-700',
                )}
              >
                {chosen ? '✓ Это место свидания' : 'Выбрать местом свидания'}
              </button>

              <a
                href={`https://yandex.ru/maps/?pt=${location.coords.lng},${location.coords.lat}&z=16&l=map`}
                target="_blank"
                rel="noreferrer noopener"
                className="glass-thin flex-1 rounded-2xl px-5 py-3.5 text-center text-[15px] font-medium text-ink-900 transition hover:bg-white/75"
              >
                Открыть в картах
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
