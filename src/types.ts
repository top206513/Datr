export type LocationCategory = 'view' | 'walk' | 'dinner' | 'culture' | 'coffee' | 'night'

export interface DateLocation {
  id: string
  name: string
  /** Короткая строка-подзаголовок: район, улица */
  area: string
  category: LocationCategory
  /** Развёрнутое описание — почему это место работает для свидания */
  description: string
  /** Совет «от себя»: как именно провести здесь время */
  tip: string
  rating: number
  /** Средний чек / стоимость визита */
  price: string
  /** Лучшее время для визита */
  bestTime: string
  /** Сколько времени закладывать */
  duration: string
  coords: { lat: number; lng: number }
  tags: string[]
}

export interface ChecklistItem {
  id: string
  title: string
  hint?: string
  group: ChecklistGroup
  /** Пользовательские пункты можно удалять */
  custom?: boolean
}

export type ChecklistGroup = 'before' | 'look' | 'day'

export interface Track {
  id: string
  title: string
  mood: string
  /** Длительность в секундах */
  duration: number
  bpm: number
  /** Тональность — корневая нота в Гц */
  root: number
  /** Сетка аккордов: полутоны относительно корня */
  progression: number[][]
  /** Ноты мелодии: полутоны относительно корня, null — пауза */
  melody: (number | null)[]
  /** Тембр ведущего голоса */
  lead: OscillatorType
  /** Насыщенность шумовой подложки (дождь / винил), 0–1 */
  texture: number
}

export interface PlannedDate {
  /** ISO-строка запланированного момента */
  at: string | null
  /** id выбранной локации */
  locationId: string | null
  title: string
}
