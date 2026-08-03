import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import clsx from 'clsx'
import { useCountdown } from '@/hooks/useCountdown'
import { formatDateLong, plural, toInputValue } from '@/lib/time'
import type { DateLocation, PlannedDate } from '@/types'

interface CountdownProps {
  plan: PlannedDate
  location: DateLocation | null
  onChange: (plan: PlannedDate) => void
}

const UNITS: { key: 'days' | 'hours' | 'minutes' | 'seconds'; forms: [string, string, string] }[] = [
  { key: 'days', forms: ['день', 'дня', 'дней'] },
  { key: 'hours', forms: ['час', 'часа', 'часов'] },
  { key: 'minutes', forms: ['минута', 'минуты', 'минут'] },
  { key: 'seconds', forms: ['секунда', 'секунды', 'секунд'] },
]

function TimeCell({ value, label, flash }: { value: number; label: string; flash: boolean }) {
  const text = value.toString().padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={clsx(
          'glass relative flex h-20 w-[4.25rem] items-center justify-center overflow-hidden rounded-2xl sm:h-28 sm:w-24 md:h-32 md:w-28',
          flash && 'shadow-glow',
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/35 to-transparent" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={{ y: '55%', opacity: 0, filter: 'blur(6px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: '-55%', opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl font-semibold tabular-nums text-mist-100 sm:text-5xl md:text-6xl"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-mist-500 sm:text-xs">
        {label}
      </span>
    </div>
  )
}

export function Countdown({ plan, location, onChange }: CountdownProps) {
  const [editing, setEditing] = useState(false)
  const remaining = useCountdown(plan.at)
  const isSet = Boolean(plan.at)
  const isPast = remaining?.isPast ?? false
  /** Меньше часа до встречи — момент, когда таймер должен «гореть» */
  const isSoon = !isPast && (remaining?.total ?? Infinity) < 60 * 60 * 1000

  const handleDate = (value: string) => {
    onChange({ ...plan, at: value ? new Date(value).toISOString() : null })
  }

  return (
    <div className="glass-strong relative overflow-hidden rounded-xl2 p-6 sm:p-9 md:p-12">
      <div
        aria-hidden
        className={clsx(
          'absolute -top-24 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-1000',
          isSoon
            ? 'bg-wine-500/35 opacity-100 animate-pulse-soft'
            : 'bg-wine-500/20 opacity-70',
        )}
      />

      <div className="relative">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-400/80">
              {isPast ? 'Это уже случилось' : 'До встречи осталось'}
            </p>
            <h3 className="mt-2 font-display text-2xl text-mist-100 sm:text-3xl">
              {plan.title || 'Свидание'}
            </h3>
            {isSet && (
              <p className="mt-1 text-sm text-mist-300 first-letter:uppercase">
                {formatDateLong(plan.at)}
                {location && (
                  <>
                    {' · '}
                    <span className="text-wine-300">{location.name}</span>
                  </>
                )}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-mist-100 transition hover:border-gold-400/60 hover:bg-white/10 hover:text-gold-300"
          >
            {editing ? 'Готово' : isSet ? 'Изменить' : 'Назначить дату'}
          </button>
        </div>

        {isSet && remaining ? (
          <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4 md:gap-6">
            {UNITS.map(({ key, forms }) => (
              <TimeCell
                key={key}
                value={remaining[key]}
                label={plural(remaining[key], forms)}
                flash={isSoon}
              />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-mist-300">
            Дата ещё не выбрана. Нажмите «Назначить дату» — и время начнёт идти в обратную сторону.
          </p>
        )}

        {isPast && isSet && (
          <p className="mt-7 text-center text-sm text-gold-300">
            Надеемся, всё прошло идеально. Назначьте следующую встречу — вторая всегда проще первой.
          </p>
        )}

        <AnimatePresence initial={false}>
          {editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-8 grid gap-4 border-t border-white/10 pt-7 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-mist-500">
                    Дата и время
                  </span>
                  <input
                    type="datetime-local"
                    value={toInputValue(plan.at)}
                    onChange={(e) => handleDate(e.target.value)}
                    className="w-full rounded-xl border border-white/12 bg-night-900/70 px-4 py-3 text-mist-100 transition focus:border-gold-400/70 focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-mist-500">
                    Как назовём вечер
                  </span>
                  <input
                    type="text"
                    value={plan.title}
                    maxLength={60}
                    placeholder="Например: тот самый вечер"
                    onChange={(e) => onChange({ ...plan, title: e.target.value })}
                    className="w-full rounded-xl border border-white/12 bg-night-900/70 px-4 py-3 text-mist-100 placeholder:text-mist-500/70 transition focus:border-gold-400/70 focus:outline-none"
                  />
                </label>

                <p className="text-xs text-mist-500 sm:col-span-2">
                  {location
                    ? `Место выбрано: ${location.name}. Поменять можно на карте ниже.`
                    : 'Место пока не выбрано — откройте карту и отметьте точку встречи.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
