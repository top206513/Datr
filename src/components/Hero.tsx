import { motion } from 'framer-motion'
import { formatDateLong } from '@/lib/time'
import type { DateLocation, PlannedDate } from '@/types'

interface HeroProps {
  plan: PlannedDate
  location: DateLocation | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function Hero({ plan, location }: HeroProps) {
  return (
    <section id="top" className="relative flex min-h-[92dvh] items-center px-5 pb-36 pt-28 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs text-mist-300 backdrop-blur-sm"
        >
          <span className="size-1.5 animate-pulse-soft rounded-full bg-wine-400" aria-hidden />
          Планировщик свиданий, выросший из одного вечера
        </motion.p>

        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl text-5xl leading-[1.05] text-mist-100 sm:text-7xl md:text-8xl"
        >
          Успеть на <span className="text-gradient">последний поезд</span>
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-7 max-w-xl text-base leading-relaxed text-mist-300 sm:text-lg"
        >
          Railway Last собирает всё, из чего складывается идеальное свидание: место, время, музыку
          и десяток мелочей, о которых легко забыть. Не приложение для знакомств — приложение для
          того, что происходит после.
        </motion.p>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <a
            href="#countdown"
            className="rounded-full bg-linear-to-r from-wine-500 to-gold-500 px-7 py-3.5 text-sm font-semibold text-night-950 shadow-glow transition hover:brightness-110"
          >
            Назначить вечер
          </a>
          <a
            href="#places"
            className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-mist-100 transition hover:border-gold-400/60 hover:text-gold-300"
          >
            Посмотреть места
          </a>
        </motion.div>

        {plan.at && (
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mist-500"
          >
            <span className="first-letter:uppercase">
              <span className="text-mist-300">Ближайшее:</span> {formatDateLong(plan.at)}
            </span>
            {location && (
              <span>
                <span className="text-mist-300">Место:</span> {location.name}
              </span>
            )}
          </motion.div>
        )}
      </div>

    </section>
  )
}
