export function Footer() {
  return (
    <footer className="px-5 pb-36 pt-10 sm:px-8 sm:pb-40">
      <div className="mx-auto w-full max-w-6xl">
        <div className="hairline mb-8" />
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="font-display text-lg text-mist-100">
            Railway <span className="text-gradient">Last</span>
          </p>
          <p className="max-w-md text-xs leading-relaxed text-mist-500">
            Данные хранятся только в вашем браузере — ни дата, ни отметки, ни избранные места никуда
            не отправляются. Карта работает на OpenStreetMap.
          </p>
        </div>
      </div>
    </footer>
  )
}
