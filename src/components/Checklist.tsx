import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { DEFAULT_CHECKLIST, GROUP_META } from '@/data/checklist'
import { Section } from '@/components/ui/Section'
import { useGlass } from '@/hooks/useGlass'
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
  const radius = 32
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative grid size-20 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="fill-none stroke-ink-900/12"
          strokeWidth="5"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          className="fill-none stroke-ink-900"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="text-[15px] font-semibold tabular-nums text-ink-900">
        {Math.round(ratio * 100)}%
      </span>
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
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group/item relative"
    >
      <label
        className={clsx(
          'flex cursor-pointer items-start gap-3 rounded-2xl p-3 transition-colors duration-300',
          checked ? 'bg-transparent' : 'bg-white/35 hover:bg-white/60',
        )}
      >
        <input type="checkbox" checked={checked} onChange={onToggle} className="peer sr-only" />

        <span
          aria-hidden
          className={clsx(
            'mt-px grid size-[22px] shrink-0 place-items-center rounded-full transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-ink-900 peer-focus-visible:ring-offset-2',
            checked
              ? 'bg-ink-900 text-cream-50'
              : 'bg-white/70 text-transparent shadow-[inset_0_0_0_1px_rgba(23,18,15,0.16)]',
          )}
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="size-3 fill-none stroke-current stroke-[3.2]"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ scale: checked ? 1 : 0.5, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <path d="M4 12.5 9.5 18 20 6.5" />
          </motion.svg>
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={clsx(
              'block text-[14px] transition-colors duration-300',
              checked ? 'text-ink-400 line-through' : 'text-ink-900',
            )}
          >
            {item.title}
          </span>
          {item.hint && (
            <span
              className={clsx(
                'mt-0.5 block text-[12px] leading-relaxed transition-colors duration-300',
                checked ? 'text-ink-300' : 'text-ink-500',
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
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-[11px] text-ink-300 opacity-0 transition hover:bg-white/70 hover:text-ink-900 focus-visible:opacity-100 group-hover/item:opacity-100"
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
  const summary = useGlass({ radius: 24 })

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

  const fieldClass =
    'w-full rounded-2xl border-0 bg-white/55 px-4 py-3.5 text-[14px] text-ink-900 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.7)] outline-none transition placeholder:text-ink-400 focus:bg-white/80'

  return (
    <Section
      id="checklist"
      eyebrow="Подготовка"
      title="Чтобы вечер прошёл так, как вы задумали"
      description="Идеальное свидание — это не импровизация, а несколько заранее закрытых мелочей. Отмечайте пункты: прогресс сохранится, даже если закрыть вкладку."
      aside={
        <div className="glass flex items-center gap-5 rounded-3xl px-6 py-5" {...summary.props}>
          {summary.layers}
          <ProgressRing value={doneCount} total={items.length} />
          <div>
            <p className="text-lg font-semibold tracking-tight text-ink-900">
              {doneCount} из {items.length}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-500">
              {left === 0
                ? 'всё готово'
                : `осталось ${left} ${plural(left, ['пункт', 'пункта', 'пунктов'])}`}
            </p>
            {doneCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="mt-2 text-[11px] text-ink-400 underline decoration-dotted underline-offset-4 transition hover:text-ink-900"
              >
                сбросить отметки
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        {GROUP_ORDER.map((group, groupIndex) => {
          const groupItems = items.filter((item) => item.group === group)
          const groupDone = groupItems.filter((item) => checked.includes(item.id)).length
          const meta = GROUP_META[group]
          const complete = groupItems.length > 0 && groupDone === groupItems.length

          return (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: groupIndex * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="glass flex flex-col rounded-glass p-4 sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3 px-1">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-ink-900">
                    {meta.label}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-ink-500">{meta.caption}</p>
                </div>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors duration-500',
                    complete ? 'bg-ink-900 text-cream-50' : 'bg-white/60 text-ink-500',
                  )}
                >
                  {groupDone}/{groupItems.length}
                </span>
              </div>

              <ul className="flex flex-1 flex-col gap-1">
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
        className="glass mt-4 flex flex-col gap-2.5 rounded-glass p-4 sm:flex-row sm:items-center"
      >
        <label className="flex-1">
          <span className="sr-only">Новый пункт чек-листа</span>
          <input
            type="text"
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Добавить своё: заказать такси, взять зонт…"
            className={fieldClass}
          />
        </label>

        <label className="sm:w-48">
          <span className="sr-only">Раздел</span>
          <select
            value={draftGroup}
            onChange={(e) => setDraftGroup(e.target.value as ChecklistGroup)}
            className={fieldClass}
          >
            {GROUP_ORDER.map((group) => (
              <option key={group} value={group}>
                {GROUP_META[group].label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-2xl bg-ink-900 px-6 py-3.5 text-[14px] font-medium text-cream-50 transition duration-300 hover:bg-ink-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-ink-900"
        >
          Добавить
        </button>
      </form>
    </Section>
  )
}
