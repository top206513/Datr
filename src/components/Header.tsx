import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { CupidMark } from '@/components/CupidMark'
import { useGlass } from '@/hooks/useGlass'

const LINKS = [
  { href: '#story', label: 'Замысел' },
  { href: '#countdown', label: 'Отсчёт' },
  { href: '#places', label: 'Места' },
  { href: '#checklist', label: 'Подготовка' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('#story')
  // Навигация обретает стекло только после прокрутки — до этого она просто текст
  const logo = useGlass({ radius: 999, enabled: scrolled, overlay: true })
  const nav = useGlass({ radius: 999, enabled: scrolled, overlay: true })
  const cta = useGlass({ radius: 999, overlay: true })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Подсветка активного раздела в навигации
  useEffect(() => {
    const sections = LINKS.map((link) => document.querySelector(link.href)).filter(
      (el): el is Element => el !== null,
    )

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(`#${visible.target.id}`)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <a
          href="#top"
          className={clsx(
            'flex items-center gap-2.5 rounded-full py-2 transition-all duration-500',
            scrolled ? 'glass-thin px-4' : 'px-1',
          )}
          {...logo.props}
        >
          {scrolled && logo.layers}
          <CupidMark className="size-5 shrink-0 text-ink-900" weight={3} />
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">
            Railway Last
          </span>
        </a>

        <nav
          className={clsx(
            'hidden items-center gap-0.5 rounded-full p-1 transition-all duration-500 md:flex',
            scrolled ? 'glass-thin' : '',
          )}
          {...nav.props}
        >
          {scrolled && nav.layers}
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={clsx(
                'rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300',
                active === link.href
                  ? 'glass-active'
                  : 'text-ink-700 hover:bg-white/40 hover:text-ink-900',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#countdown"
          className="glass-thin rounded-full px-4 py-2 text-[13px] font-medium text-ink-900 transition hover:bg-white/70"
          {...cta.props}
        >
          {cta.layers}
          К свиданию
        </a>
      </div>
    </header>
  )
}
