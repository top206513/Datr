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
    <div className="glass grid h-[380px] place-items-center rounded-xl2 sm:h-[460px] lg:h-full lg:min-h-[560px]">
      <p className="animate-pulse-soft text-sm text-mist-500">Загружаем карту…</p>
    </div>
  )
}

type Filter = LocationCategory | 'all' | 'favorites'

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all', label: 'Все места', icon: '✦' },
  ...(Object.entries(CATEGORY_META) as [LocationCategory, (typeof CATEGORY_META)[LocationCategory]][]).map(
    ([key, meta]) => ({ key: key as Filter, label: meta.label, icon: meta.icon }),
  ),
  { key: 'favorites', label: 'Избранное', icon: '♥' },
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
          Карта мест, <span className="text-gradient">где вечер получается</span>
        </>
      }
      description="Двенадцать точек на карте города — от кофе перед прогулкой до последнего поезда. Откройте карточку, чтобы увидеть описание, лучшее время и совет, как провести здесь время."
      aside={
        <div className="glass rounded-2xl px-5 py-4 text-center">
          <p className="font-display text-3xl text-gold-300">{visible.length}</p>
          <p className="text-xs text-mist-500">
            {plural(visible.length, ['место', 'места', 'мест'])} в подборке
          </p>
        </div>
      }
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={active}
                className={clsx(
                  'relative rounded-full px-4 py-2 text-xs font-medium transition-colors duration-200',
                  active ? 'text-night-950' : 'text-mist-300 hover:text-mist-100',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-gold-300 to-wine-300"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={clsx(
                    'relative flex items-center gap-1.5',
                    !active && 'rounded-full',
                  )}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </span>
                {!active && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full border border-white/10 bg-white/[0.04]"
                  />
                )}
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
            className="w-full rounded-full border border-white/12 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-mist-100 placeholder:text-mist-500 transition focus:border-gold-400/60 focus:outline-none"
          />
          <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500">
            ⌕
          </span>
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-stretch">
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
          className="glass max-h-[560px] overflow-y-auto rounded-xl2 p-3 sm:p-4"
          onMouseLeave={() => setActiveId(null)}
        >
          <AnimatePresence mode="popLayout">
            {visible.length > 0 ? (
              <motion.div layout className="flex flex-col gap-2.5">
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
                className="px-4 py-16 text-center text-sm text-mist-500"
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
