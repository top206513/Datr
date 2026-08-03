import { CupidMark } from '@/components/CupidMark'

export function Footer() {
  return (
    <footer className="px-5 pb-44 pt-8 sm:px-8 sm:pb-48">
      <div className="mx-auto w-full max-w-6xl">
        <div className="hairline mb-8" />
        <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <p className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-ink-900">
            <CupidMark className="size-5 text-ink-900" weight={3} />
            Railway Last
          </p>
          <p className="max-w-md text-[12px] leading-relaxed text-ink-400">
            Данные хранятся только в вашем браузере — ни дата, ни отметки, ни избранные места
            никуда не отправляются. Карта работает на OpenStreetMap и CARTO.
          </p>
        </div>
      </div>
    </footer>
  )
}
