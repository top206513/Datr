import { useCallback, useMemo } from 'react'
import { Atmosphere } from '@/components/Atmosphere'
import { Checklist } from '@/components/Checklist'
import { Countdown } from '@/components/Countdown'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { MapExplorer } from '@/components/MapExplorer'
import { MusicPlayer } from '@/components/MusicPlayer'
import { Story } from '@/components/Story'
import { Section } from '@/components/ui/Section'
import { LOCATIONS } from '@/data/locations'
import { usePersistentState } from '@/hooks/usePersistentState'
import { STORAGE_KEYS } from '@/lib/storage'
import { defaultDateTime } from '@/lib/time'
import type { ChecklistItem, PlannedDate } from '@/types'

const INITIAL_PLAN: PlannedDate = {
  at: defaultDateTime(),
  locationId: null,
  title: 'Тот самый вечер',
}

export default function App() {
  const [plan, setPlan] = usePersistentState<PlannedDate>(STORAGE_KEYS.plan, INITIAL_PLAN)
  const [favorites, setFavorites] = usePersistentState<string[]>(STORAGE_KEYS.favorites, [])
  const [checked, setChecked] = usePersistentState<string[]>(STORAGE_KEYS.checkedItems, [])
  const [customItems, setCustomItems] = usePersistentState<ChecklistItem[]>(
    STORAGE_KEYS.customItems,
    [],
  )

  const chosenLocation = useMemo(
    () => LOCATIONS.find((location) => location.id === plan.locationId) ?? null,
    [plan.locationId],
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      )
    },
    [setFavorites],
  )

  const chooseLocation = useCallback(
    (id: string) => {
      setPlan((current) => ({ ...current, locationId: current.locationId === id ? null : id }))
    },
    [setPlan],
  )

  const toggleChecked = useCallback(
    (id: string) => {
      setChecked((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      )
    },
    [setChecked],
  )

  const addItem = useCallback(
    (item: ChecklistItem) => setCustomItems((current) => [...current, item]),
    [setCustomItems],
  )

  const removeItem = useCallback(
    (id: string) => {
      setCustomItems((current) => current.filter((item) => item.id !== id))
      setChecked((current) => current.filter((item) => item !== id))
    },
    [setCustomItems, setChecked],
  )

  const resetChecked = useCallback(() => setChecked([]), [setChecked])

  return (
    <>
      <Atmosphere />
      <Header />

      <main>
        <Hero plan={plan} location={chosenLocation} />

        <Story />

        <Section
          id="countdown"
          eyebrow="Отсчёт"
          title={
            <>
              Сколько осталось <span className="text-gradient">до встречи</span>
            </>
          }
          description="Назначьте дату — и она сохранится в браузере вместе с выбранным местом. Таймер идёт по системным часам, поэтому не собьётся, даже если закрыть вкладку на неделю."
        >
          <Countdown plan={plan} location={chosenLocation} onChange={setPlan} />
        </Section>

        <MapExplorer
          favorites={favorites}
          chosenId={plan.locationId}
          onChoose={chooseLocation}
          onToggleFavorite={toggleFavorite}
        />

        <Checklist
          customItems={customItems}
          checked={checked}
          onToggle={toggleChecked}
          onAdd={addItem}
          onRemove={removeItem}
          onReset={resetChecked}
        />
      </main>

      <Footer />
      <MusicPlayer />
    </>
  )
}
