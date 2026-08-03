import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, lazy, useMemo, useState } from 'react'
import clsx from 'clsx'
import { CATEGORY_META, LOCATIONS } from '@/data/locations'
import { LocationCard } from '@/components/LocationCard'
import { LocationDialog } from '@/components/LocationDialog'
import { Section } from '@/components/ui/Section'
import { plural } from '@/lib/time'
import type { LocationCategory } from '@/types'

interface MapExplorerProps {
  favorites: string[]
  chosenId: string | null
  onChoose: (id: string) => void
  onToggleFavorite: (id: string) => void
}

// Leaflet весит заметно больше остального интерфейса — грузим его отдельным чанком.
const MapView = lazy(() =>
  import('@/components/MapView').then((module) => ({ default: module.MapView })),
)

function MapSkeleton() {
  return (
    <div className="glass grid h-[380px] place-items-center rounded-glass-lg sm:h-[460px] lg:h-full lg:min-h-[560px]">
      <p className="animate-breathe text-sm text-ink-500">Загружаем карту…</p>
    </div>
  )
}

type Filter = LocationCategory | 'all' | 'favorites'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  ...(
    Object.entries(CATEGORY_META) as [LocationCategory, (typeof CATEGORY_META)[LocationCategory]][]
  ).map(([key, meta]) => ({ key: key as Filter, label: meta.label })),
  { key: 'favorites', label: '♥' },
]

export function MapExplorer({ favorites, chosenId, onChoose, onToggleFavorite }: MapExplorerProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return LOCATIONS.filter((location) => {
      if (filter === 'favorites' && !favorites.includes(location.id)) return false
      if (filter !== 'all' && filter !== 'favorites' && location.category !== filter) return false
      if (!needle) return true

      return [location.name, location.area, ...location.tags].some((field) =>
        field.toLowerCase().includes(needle),
      )
    })
  }, [filter, query, favorites])

  const openLocation = LOCATIONS.find((l) => l.id === openId) ?? null

  return (
    <Section
      id="places"
      eyebrow="Куда пойти"
      title={
        <>
          Карта мест,
          <br />
          где вечер получается
        </>
      }
      description="Двенадцать точек на карте города — от кофе перед прогулкой до последнего поезда. Откройте карточку, чтобы увидеть описание, лучшее время и совет, как провести здесь время."
      aside={
        <div className="glass rounded-3xl px-6 py-5 text-center">
          <p className="text-4xl font-semibold tabular-nums tracking-tight text-ink-900">
            {visible.length}
          </p>
          <p className="mt-1 text-[12px] text-ink-500">
            {plural(visible.length, ['место', 'места', 'мест'])} в подборке
          </p>
        </div>
      }
    >
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="glass-thin flex flex-wrap gap-1 rounded-full p-1">
          {FILTERS.map((item) => {
            const active = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={active}
                aria-label={item.key === 'favorites' ? 'Избранное' : item.label}
                className={clsx(
                  'relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300',
                  active ? 'text-cream-50' : 'text-ink-700 hover:text-ink-900',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-ink-900"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            )
          })}
        </div>

        <label className="relative lg:w-64">
          <span className="sr-only">Поиск по местам</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти место или тег"
            className="glass-thin w-full rounded-full border-0 px-5 py-2.5 text-[14px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:bg-white/80"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:items-stretch">
        <Suspense fallback={<MapSkeleton />}>
          <MapView
            locations={visible}
            activeId={activeId}
            chosenId={chosenId}
            onSelect={(id) => {
              setActiveId(id)
              setOpenId(id)
            }}
          />
        </Suspense>

        <div
          className="glass max-h-[560px] overflow-y-auto rounded-glass-lg p-2.5 sm:p-3"
          onMouseLeave={() => setActiveId(null)}
        >
          <AnimatePresence mode="popLayout">
            {visible.length > 0 ? (
              <motion.div layout className="flex flex-col gap-1">
                {visible.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    active={activeId === location.id}
                    chosen={chosenId === location.id}
                    favorite={favorites.includes(location.id)}
                    onOpen={() => {
                      setActiveId(location.id)
                      setOpenId(location.id)
                    }}
                    onHover={() => setActiveId(location.id)}
                    onToggleFavorite={() => onToggleFavorite(location.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-20 text-center text-sm text-ink-500"
              >
                Здесь пока пусто. Попробуйте другой фильтр — или добавьте пару мест в избранное.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <LocationDialog
        location={openLocation}
        chosen={openLocation?.id === chosenId}
        favorite={openLocation ? favorites.includes(openLocation.id) : false}
        onClose={() => setOpenId(null)}
        onChoose={(id) => {
          onChoose(id)
          setOpenId(null)
        }}
        onToggleFavorite={onToggleFavorite}
      />
    </Section>
  )
}
