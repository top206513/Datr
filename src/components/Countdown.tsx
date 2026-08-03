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

function TimeCell({ value, label }: { value: number; label: string }) {
  const text = value.toString().padStart(2, '0')

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="glass-inset relative flex h-24 w-full items-center justify-center overflow-hidden rounded-3xl sm:h-32">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={{ y: '48%', opacity: 0, filter: 'blur(5px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: '-48%', opacity: 0, filter: 'blur(5px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-semibold tabular-nums tracking-tight text-ink-900 sm:text-6xl"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[11px] font-medium text-ink-500">{label}</span>
    </div>
  )
}

export function Countdown({ plan, location, onChange }: CountdownProps) {
  const [editing, setEditing] = useState(false)
  const remaining = useCountdown(plan.at)
  const isSet = Boolean(plan.at)
  const isPast = remaining?.isPast ?? false

  const handleDate = (value: string) => {
    onChange({ ...plan, at: value ? new Date(value).toISOString() : null })
  }

  const fieldClass =
    'w-full rounded-2xl border-0 bg-white/55 px-4 py-3.5 text-[15px] text-ink-900 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.7)] outline-none transition placeholder:text-ink-400 focus:bg-white/80 focus:shadow-[inset_0_0_0_1px_rgba(23,18,15,0.35)]'

  return (
    <div className="glass rounded-glass-lg p-6 sm:p-9 md:p-11">
      <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{isPast ? 'Это уже случилось' : 'До встречи'}</p>
          <h3 className="mt-3 text-3xl text-ink-900 sm:text-4xl">{plan.title || 'Свидание'}</h3>
          {isSet && (
            <p className="mt-2 text-sm text-ink-500">
              <span className="first-letter:uppercase">{formatDateLong(plan.at)}</span>
              {location && <> · {location.name}</>}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={clsx(
            'rounded-full px-5 py-2.5 text-[13px] font-medium transition duration-300 active:scale-[0.97]',
            editing ? 'glass-active' : 'glass-thin text-ink-900 hover:bg-white/70',
          )}
        >
          {editing ? 'Готово' : isSet ? 'Изменить' : 'Назначить дату'}
        </button>
      </div>

      {isSet && remaining ? (
        <div className="flex items-start gap-2 sm:gap-3">
          {UNITS.map(({ key, forms }) => (
            <TimeCell key={key} value={remaining[key]} label={plural(remaining[key], forms)} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-[15px] text-ink-500">
          Дата ещё не выбрана. Нажмите «Назначить дату» — и время пойдёт в обратную сторону.
        </p>
      )}

      {isPast && isSet && (
        <p className="mt-8 text-center text-sm text-ink-500">
          Надеемся, всё прошло идеально. Назначьте следующую встречу — вторая всегда проще первой.
        </p>
      )}

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-9 grid gap-4 border-t border-ink-900/8 pt-8 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-ink-500">Дата и время</span>
                <input
                  type="datetime-local"
                  value={toInputValue(plan.at)}
                  onChange={(e) => handleDate(e.target.value)}
                  className={fieldClass}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium text-ink-500">Как назовём вечер</span>
                <input
                  type="text"
                  value={plan.title}
                  maxLength={60}
                  placeholder="Например: тот самый вечер"
                  onChange={(e) => onChange({ ...plan, title: e.target.value })}
                  className={fieldClass}
                />
              </label>

              <p className="text-xs text-ink-400 sm:col-span-2">
                {location
                  ? `Место выбрано: ${location.name}. Поменять можно на карте ниже.`
                  : 'Место пока не выбрано — откройте карту и отметьте точку встречи.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
