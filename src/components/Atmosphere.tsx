import { useMemo } from 'react'

interface Mote {
  left: number
  top: number
  size: number
  delay: number
  duration: number
  opacity: number
}

/**
 * Фон приложения: тёплые световые пятна, «пыль» в воздухе и плёночное зерно.
 * Чисто декоративный слой — не перехватывает события мыши.
 */
export function Atmosphere() {
  const motes = useMemo<Mote[]>(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37.4) % 100,
        top: (i * 53.7) % 100,
        size: 2 + ((i * 7) % 5),
        delay: (i * 0.7) % 9,
        duration: 7 + ((i * 3) % 8),
        opacity: 0.15 + ((i * 11) % 40) / 100,
      })),
    [],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-night-950" />

      {/* Световые пятна: закат сверху, фонарь снизу */}
      <div className="absolute -top-[30%] left-1/2 h-[85vh] w-[130vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,86,127,0.30),rgba(224,86,127,0.06)_45%,transparent_70%)] blur-3xl" />
      <div className="absolute top-[38%] -left-[15%] h-[60vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(217,164,65,0.20),transparent_65%)] blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[70vh] w-[80vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,32,67,0.75),transparent_68%)] blur-3xl" />

      {/* Пыль в свете фонарей */}
      {motes.map((mote, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold-300 animate-float"
          style={{
            left: `${mote.left}%`,
            top: `${mote.top}%`,
            width: mote.size,
            height: mote.size,
            opacity: mote.opacity,
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.duration}s`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* Плёночное зерно — снимает «пластиковость» градиентов */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Виньетка */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(11,6,14,0.85)_100%)]" />
    </div>
  )
}
