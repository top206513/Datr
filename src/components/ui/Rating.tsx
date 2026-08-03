import clsx from 'clsx'

interface RatingProps {
  value: number
  size?: 'sm' | 'md'
  showValue?: boolean
}

/** Пять звёзд с половинной точностью — через обрезку заливки по ширине. */
export function Rating({ value, size = 'sm', showValue = true }: RatingProps) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100))
  const starSize = size === 'sm' ? 'text-[13px]' : 'text-base'

  return (
    <span
      className="inline-flex items-center gap-2"
      title={`Рейтинг ${value.toFixed(1)} из 5`}
      aria-label={`Рейтинг ${value.toFixed(1)} из 5`}
    >
      <span className={clsx('relative inline-block leading-none tracking-[0.12em]', starSize)}>
        <span className="text-mist-500/45" aria-hidden>
          ★★★★★
        </span>
        <span
          aria-hidden
          className="absolute inset-0 overflow-hidden whitespace-nowrap text-gold-400"
          style={{ width: `${percent}%` }}
        >
          ★★★★★
        </span>
      </span>
      {showValue && (
        <span className="text-xs font-semibold tabular-nums text-gold-300">{value.toFixed(1)}</span>
      )}
    </span>
  )
}
