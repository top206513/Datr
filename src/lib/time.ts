export interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** Полная разница в миллисекундах; ≤ 0 — момент уже наступил */
  total: number
  isPast: boolean
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Раскладывает разницу между `target` и `now` на дни/часы/минуты/секунды. */
export function getRemaining(target: Date | string | number, now: number = Date.now()): Remaining {
  const targetMs = target instanceof Date ? target.getTime() : new Date(target).getTime()

  if (Number.isNaN(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: true }
  }

  const total = targetMs - now
  const abs = Math.max(total, 0)

  return {
    days: Math.floor(abs / DAY),
    hours: Math.floor((abs % DAY) / HOUR),
    minutes: Math.floor((abs % HOUR) / MINUTE),
    seconds: Math.floor((abs % MINUTE) / SECOND),
    total,
    isPast: total <= 0,
  }
}

/**
 * Русское склонение числительных.
 * `plural(2, ['день', 'дня', 'дней']) → 'дня'`
 */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const tail = abs % 10

  if (abs > 10 && abs < 20) return forms[2]
  if (tail > 1 && tail < 5) return forms[1]
  if (tail === 1) return forms[0]
  return forms[2]
}

/** `formatClock(125) → '2:05'` — для прогресс-бара плеера. */
export function formatClock(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

/** Человекочитаемая дата свидания: «пятница, 12 сентября, 19:30». */
export function formatDateLong(value: string | Date | null): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return DATE_FMT.format(date)
}

/** Значение для `<input type="datetime-local">` в локальном времени. */
export function toInputValue(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

/** Дата по умолчанию: ближайшая пятница, 19:30. */
export function defaultDateTime(now: Date = new Date()): string {
  const date = new Date(now)
  date.setSeconds(0, 0)
  date.setHours(19, 30)

  const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7
  date.setDate(date.getDate() + daysUntilFriday)

  return date.toISOString()
}
