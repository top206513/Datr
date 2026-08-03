import clsx from 'clsx'

interface RatingProps {
  value: number
  size?: 'sm' | 'md'
  showValue?: boolean
}

/**
 * Рейтинг точкой, а не пятью звёздами: в минималистичной сетке
 * пять символов создают лишний шум, а число читается сразу.
 */
export function Rating({ value, size = 'sm', showValue = true }: RatingProps) {
  const ratio = Math.max(0, Math.min(1, value / 5))

  return (
    <span
      className="inline-flex items-center gap-2"
      title={`Рейтинг ${value.toFixed(1)} из 5`}
      aria-label={`Рейтинг ${value.toFixed(1)} из 5`}
    >
      <span
        aria-hidden
        className={clsx(
          'relative block overflow-hidden rounded-full bg-ink-900/12',
          size === 'sm' ? 'h-1 w-10' : 'h-1.5 w-16',
        )}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-ink-900/70"
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      {showValue && (
        <span
          className={clsx(
            'font-medium tabular-nums text-ink-700',
            size === 'sm' ? 'text-xs' : 'text-sm',
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
    </span>
  )
}
