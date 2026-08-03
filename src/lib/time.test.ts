import { describe, expect, it } from 'vitest'
import { defaultDateTime, formatClock, getRemaining, plural, toInputValue } from './time'

describe('getRemaining', () => {
  const now = new Date('2026-09-01T12:00:00Z').getTime()

  it('раскладывает разницу на дни, часы, минуты и секунды', () => {
    const target = new Date('2026-09-03T14:30:45Z')
    const r = getRemaining(target, now)

    expect(r).toMatchObject({ days: 2, hours: 2, minutes: 30, seconds: 45, isPast: false })
  })

  it('помечает прошедшую дату и не уходит в отрицательные части', () => {
    const r = getRemaining(new Date('2026-08-30T12:00:00Z'), now)

    expect(r.isPast).toBe(true)
    expect(r.total).toBeLessThan(0)
    expect([r.days, r.hours, r.minutes, r.seconds]).toEqual([0, 0, 0, 0])
  })

  it('считает ровно наступивший момент прошедшим', () => {
    expect(getRemaining(now, now).isPast).toBe(true)
  })

  it('не падает на некорректной дате', () => {
    expect(getRemaining('не дата', now).isPast).toBe(true)
  })
})

describe('plural', () => {
  const forms: [string, string, string] = ['день', 'дня', 'дней']

  it.each([
    [1, 'день'],
    [2, 'дня'],
    [4, 'дня'],
    [5, 'дней'],
    [11, 'дней'],
    [14, 'дней'],
    [21, 'день'],
    [22, 'дня'],
    [25, 'дней'],
    [101, 'день'],
    [0, 'дней'],
  ])('%i → %s', (n, expected) => {
    expect(plural(n, forms)).toBe(expected)
  })
})

describe('formatClock', () => {
  it('форматирует секунды как m:ss', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(9)).toBe('0:09')
    expect(formatClock(125)).toBe('2:05')
    expect(formatClock(3599)).toBe('59:59')
  })

  it('защищается от NaN и отрицательных значений', () => {
    expect(formatClock(NaN)).toBe('0:00')
    expect(formatClock(-10)).toBe('0:00')
  })
})

describe('toInputValue', () => {
  it('возвращает пустую строку для пустых и битых значений', () => {
    expect(toInputValue(null)).toBe('')
    expect(toInputValue('не дата')).toBe('')
  })

  it('форматирует по маске datetime-local', () => {
    const iso = new Date(2026, 8, 12, 19, 30).toISOString()
    expect(toInputValue(iso)).toBe('2026-09-12T19:30')
  })
})

describe('defaultDateTime', () => {
  it('выбирает ближайшую пятницу в 19:30', () => {
    // 2026-09-01 — вторник
    const result = new Date(defaultDateTime(new Date(2026, 8, 1, 10, 0)))

    expect(result.getDay()).toBe(5)
    expect(result.getDate()).toBe(4)
    expect(result.getHours()).toBe(19)
    expect(result.getMinutes()).toBe(30)
  })

  it('в пятницу предлагает следующую, а не сегодняшнюю', () => {
    const result = new Date(defaultDateTime(new Date(2026, 8, 4, 10, 0)))

    expect(result.getDay()).toBe(5)
    expect(result.getDate()).toBe(11)
  })
})
