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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={onHover}
      className={clsx(
        'group relative overflow-hidden rounded-3xl p-3.5 transition-all duration-300',
        active || chosen ? 'bg-white/70 shadow-[0_6px_20px_-10px_rgba(93,44,52,0.4)]' : 'hover:bg-white/45',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3.5 text-left outline-none"
        aria-label={`Открыть карточку: ${location.name}`}
      >
        <span
          className="glass-thin grid size-11 shrink-0 place-items-center rounded-2xl text-[15px]"
          aria-hidden
        >
          {meta.icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold tracking-tight text-ink-900">
              {location.name}
            </span>
            {chosen && (
              <span className="shrink-0 rounded-full bg-ink-900 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cream-50">
                выбрано
              </span>
            )}
          </span>

          <span className="mt-0.5 block truncate text-[13px] text-ink-500">{location.area}</span>

          <span className="mt-2 flex items-center gap-3">
            <Rating value={location.rating} />
            <span className="text-[12px] text-ink-400">{location.duration}</span>
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={favorite}
        aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        className={clsx(
          'absolute right-3 top-3 grid size-7 place-items-center rounded-full text-[13px] transition duration-300',
          favorite
            ? 'text-rose-600'
            : 'text-ink-300 opacity-0 hover:bg-white/60 hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100',
        )}
      >
        {favorite ? '♥' : '♡'}
      </button>
    </motion.article>
  )
}
