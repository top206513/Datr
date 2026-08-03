interface CupidMarkProps {
  className?: string
  /** Толщина линии в единицах viewBox 64×64 */
  weight?: number
}

/**
 * Знак приложения: сердце, пробитое стрелой.
 * Нарисован линией в одну толщину — так он одинаково читается
 * и в иконке 32 px, и в «обложке» плеера на пол-экрана.
 */
export function CupidMark({ className, weight = 2.2 }: CupidMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Стрела: древко уходит за сердце и выходит с другой стороны */}
        <path d="M7 51.5 24 38" />
        <path d="M41.5 25.5 57.5 12.5" />
        {/* Наконечник */}
        <path d="M49.5 11.2 58.6 11.4 58.4 20.5" />
        {/* Оперение: два пера от хвоста вдоль древка */}
        <path d="M7 51.5 15.4 50" />
        <path d="M7 51.5 8.6 43.2" />

        {/* Сердце */}
        <path d="M32 51.5C32 51.5 11 39.4 11 25.2C11 17.6 16.7 12.4 22.9 12.4C27.2 12.4 30.4 14.9 32 17.6C33.6 14.9 36.8 12.4 41.1 12.4C47.3 12.4 53 17.6 53 25.2C53 39.4 32 51.5 32 51.5Z" />
      </g>
    </svg>
  )
}
