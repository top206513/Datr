import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { DEFAULT_CHECKLIST, GROUP_META } from '@/data/checklist'
import { Section } from '@/components/ui/Section'
import { plural } from '@/lib/time'
import type { ChecklistGroup, ChecklistItem } from '@/types'

interface ChecklistProps {
  customItems: ChecklistItem[]
  checked: string[]
  onToggle: (id: string) => void
  onAdd: (item: ChecklistItem) => void
  onRemove: (id: string) => void
  onReset: () => void
}

const GROUP_ORDER: ChecklistGroup[] = ['before', 'look', 'day']

function ProgressRing({ value, total }: { value: number; total: number }) {
  const ratio = total > 0 ? value / total : 0
  const radius = 34
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative grid size-24 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r={radius} className="fill-none stroke-white/10" strokeWidth="6" />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          className="fill-none stroke-[url(#ring-gradient)]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          initial={{ strokeDashoffset: circumference }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-wine-500)" />
            <stop offset="100%" stopColor="var(--color-gold-400)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <span className="font-display text-2xl text-mist-100">{Math.round(ratio * 100)}%</span>
      </div>
    </div>
  )
}

function Item({
  item,
  checked,
  onToggle,
  onRemove,
}: {
  item: ChecklistItem
  checked: boolean
  onToggle: () => void
  onRemove?: () => void
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="group/item relative"
    >
      <label
        className={clsx(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-300',
          checked
            ? 'border-transparent bg-white/[0.03]'
            : 'border-white/8 bg-white/[0.045] hover:border-wine-400/40 hover:bg-white/[0.075]',
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="peer sr-only"
        />

        <span
          aria-hidden
          className={clsx(
            'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-400',
            checked
              ? 'border-transparent bg-linear-to-br from-wine-400 to-gold-400 text-night-950'
              : 'border-mist-500/50 text-transparent',
          )}
        >
          <motion.span
            initial={false}
            animate={{ scale: checked ? 1 : 0.4, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.22 }}
            className="text-[11px] font-bold leading-none"
          >
            ✓
          </motion.span>
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={clsx(
              'block text-sm transition-colors duration-300',
              checked ? 'text-mist-500 line-through decoration-wine-400/60' : 'text-mist-100',
            )}
          >
            {item.title}
          </span>
          {item.hint && (
            <span
              className={clsx(
                'mt-0.5 block text-xs leading-relaxed transition-colors duration-300',
                checked ? 'text-mist-500/50' : 'text-mist-500',
              )}
            >
              {item.hint}
            </span>
          )}
        </span>
      </label>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Удалить пункт: ${item.title}`}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-xs text-mist-500 opacity-0 transition hover:bg-white/10 hover:text-wine-300 focus-visible:opacity-100 group-hover/item:opacity-100"
        >
          ✕
        </button>
      )}
    </motion.li>
  )
}

export function Checklist({
  customItems,
  checked,
  onToggle,
  onAdd,
  onRemove,
  onReset,
}: ChecklistProps) {
  const [draft, setDraft] = useState('')
  const [draftGroup, setDraftGroup] = useState<ChecklistGroup>('day')

  const items = useMemo(() => [...DEFAULT_CHECKLIST, ...customItems], [customItems])
  const doneCount = items.filter((item) => checked.includes(item.id)).length
  const left = items.length - doneCount

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return

    onAdd({
      id: `custom-${Date.now().toString(36)}`,
      title,
      group: draftGroup,
      custom: true,
    })
    setDraft('')
  }

  return (
    <Section
      id="checklist"
      eyebrow="Подготовка"
      title={
        <>
          Чтобы вечер прошёл так, <span className="text-gradient">как вы задумали</span>
        </>
      }
      description="Идеальное свидание — это не импровизация, а несколько заранее закрытых мелочей. Отмечайте пункты: прогресс сохранится, даже если закрыть вкладку."
      aside={
        <div className="glass flex items-center gap-4 rounded-2xl px-5 py-4">
          <ProgressRing value={doneCount} total={items.length} />
          <div className="pr-1">
            <p className="font-display text-xl text-mist-100">
              {doneCount} из {items.length}
            </p>
            <p className="mt-0.5 text-xs text-mist-500">
              {left === 0
                ? 'всё готово'
                : `осталось ${left} ${plural(left, ['пункт', 'пункта', 'пунктов'])}`}
            </p>
            {doneCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="mt-2 text-[11px] text-mist-500 underline decoration-dotted underline-offset-4 transition hover:text-wine-300"
              >
                сбросить отметки
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {GROUP_ORDER.map((group, groupIndex) => {
          const groupItems = items.filter((item) => item.group === group)
          const groupDone = groupItems.filter((item) => checked.includes(item.id)).length
          const meta = GROUP_META[group]
          const complete = groupItems.length > 0 && groupDone === groupItems.length

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: groupIndex * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={clsx(
                'glass flex flex-col rounded-xl2 p-4 transition-shadow duration-500 sm:p-5',
                complete && 'shadow-glow',
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-display text-xl text-mist-100">
                    <span aria-hidden>{meta.icon}</span>
                    {meta.label}
                  </h3>
                  <p className="mt-0.5 text-xs text-mist-500">{meta.caption}</p>
                </div>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors',
                    complete ? 'bg-gold-400/20 text-gold-300' : 'bg-white/8 text-mist-300',
                  )}
                >
                  {groupDone}/{groupItems.length}
                </span>
              </div>

              <ul className="flex flex-1 flex-col gap-2">
                <AnimatePresence initial={false}>
                  {groupItems.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      checked={checked.includes(item.id)}
                      onToggle={() => onToggle(item.id)}
                      onRemove={item.custom ? () => onRemove(item.id) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          )
        })}
      </div>

      <form
        onSubmit={submit}
        className="glass mt-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
      >
        <label className="flex-1">
          <span className="sr-only">Новый пункт чек-листа</span>
          <input
            type="text"
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Добавить своё: заказать такси, взять зонт…"
            className="w-full rounded-xl border border-white/12 bg-night-900/60 px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 transition focus:border-gold-400/60 focus:outline-none"
          />
        </label>

        <label className="sm:w-52">
          <span className="sr-only">Раздел</span>
          <select
            value={draftGroup}
            onChange={(e) => setDraftGroup(e.target.value as ChecklistGroup)}
            className="w-full rounded-xl border border-white/12 bg-night-900/60 px-4 py-3 text-sm text-mist-100 transition focus:border-gold-400/60 focus:outline-none"
          >
            {GROUP_ORDER.map((group) => (
              <option key={group} value={group} className="bg-night-800">
                {GROUP_META[group].label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-xl bg-linear-to-r from-wine-500 to-gold-500 px-6 py-3 text-sm font-semibold text-night-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:brightness-100"
        >
          Добавить
        </button>
      </form>
    </Section>
  )
}
