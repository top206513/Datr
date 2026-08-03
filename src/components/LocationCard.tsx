import clsx from 'clsx'
import { motion } from 'framer-motion'
import { CATEGORY_META } from '@/data/locations'
import { Rating } from '@/components/ui/Rating'
import type { DateLocation } from '@/types'

interface LocationCardProps {
  location: DateLocation
  active: boolean
  chosen: boolean
  favorite: boolean
  onOpen: () => void
  onHover: () => void
  onToggleFavorite: () => void
}

export function LocationCard({
  location,
  active,
  chosen,
  favorite,
  onOpen,
  onHover,
  onToggleFavorite,
}: LocationCardProps) {
  const meta = CATEGORY_META[location.category]

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={onHover}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border p-4 transition-colors duration-300',
        active || chosen
          ? 'border-gold-400/55 bg-white/[0.09]'
          : 'border-white/10 bg-white/[0.035] hover:border-wine-400/45 hover:bg-white/[0.07]',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3.5 text-left focus:outline-none"
        aria-label={`Открыть карточку: ${location.name}`}
      >
        <span
          className={clsx(
            'grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-lg shadow-lg transition-transform duration-300 group-hover:scale-105',
            meta.accent,
          )}
          aria-hidden
        >
          {meta.icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-display text-lg leading-snug text-mist-100">
              {location.name}
            </span>
            {chosen && (
              <span className="shrink-0 rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-300">
                выбрано
              </span>
            )}
          </span>

          <span className="mt-0.5 block truncate text-xs text-mist-500">{location.area}</span>

          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating value={location.rating} />
            <span className="text-xs text-mist-500">· {location.duration}</span>
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={favorite}
        aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        className={clsx(
          'absolute right-3 top-3 grid size-8 place-items-center rounded-full text-sm transition',
          favorite
            ? 'bg-wine-500/25 text-wine-300'
            : 'text-mist-500 opacity-0 hover:bg-white/10 hover:text-wine-300 focus-visible:opacity-100 group-hover:opacity-100',
        )}
      >
        {favorite ? '♥' : '♡'}
      </button>
    </motion.article>
  )
}
