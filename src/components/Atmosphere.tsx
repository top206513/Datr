/**
 * Фон приложения: тёплый градиент от солнечного жёлтого к коралловому.
 * Три мягких пятна очень медленно дрейфуют — именно их и преломляет
 * стекло панелей, поэтому интерфейс не выглядит статичной картинкой.
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-linear-135 from-sun-300 via-peach-200 to-rose-400" />

      <div className="absolute -left-[15%] -top-[20%] h-[75vh] w-[75vw] rounded-full bg-sun-200/85 blur-[90px] animate-drift" />
      <div
        className="absolute right-[-20%] top-[18%] h-[70vh] w-[70vw] rounded-full bg-rose-300/70 blur-[100px] animate-drift"
        style={{ animationDelay: '-7s' }}
      />
      <div
        className="absolute bottom-[-25%] left-[10%] h-[80vh] w-[85vw] rounded-full bg-rose-500/45 blur-[110px] animate-drift"
        style={{ animationDelay: '-14s' }}
      />

      {/* Светлая вуаль сверху: контент читается, градиент остаётся виден */}
      <div className="absolute inset-0 bg-linear-to-b from-cream-50/45 via-transparent to-cream-50/25" />
    </div>
  )
}
