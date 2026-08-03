import { useEffect, useState } from 'react'
import clsx from 'clsx'

const LINKS = [
  { href: '#story', label: 'Замысел' },
  { href: '#countdown', label: 'Отсчёт' },
  { href: '#places', label: 'Места' },
  { href: '#checklist', label: 'Подготовка' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('#story')

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
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-30 transition-all duration-500',
        scrolled ? 'py-2' : 'py-4',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <a
          href="#top"
          className={clsx(
            'flex items-center gap-2.5 rounded-full transition-all duration-500',
            scrolled && 'glass px-4 py-2',
          )}
        >
          <span aria-hidden className="text-lg">
            🚂
          </span>
          <span className="font-display text-lg font-semibold tracking-wide text-mist-100">
            Railway <span className="text-gradient">Last</span>
          </span>
        </a>

        <nav
          className={clsx(
            'hidden items-center gap-1 rounded-full transition-all duration-500 md:flex',
            scrolled ? 'glass px-2 py-1.5' : 'px-0 py-0',
          )}
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={clsx(
                'rounded-full px-4 py-2 text-sm transition-colors',
                active === link.href
                  ? 'bg-white/10 text-gold-300'
                  : 'text-mist-300 hover:text-mist-100',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#countdown"
          className="rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-medium text-gold-300 transition hover:bg-gold-400/20 md:text-sm"
        >
          К свиданию
        </a>
      </div>
    </header>
  )
}
