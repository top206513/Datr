import { motion } from 'framer-motion'
import { CupidMark } from '@/components/CupidMark'
import { useGlass } from '@/hooks/useGlass'
import { formatDateLong } from '@/lib/time'
import type { DateLocation, PlannedDate } from '@/types'

interface HeroProps {
  plan: PlannedDate
  location: DateLocation | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function Hero({ plan, location }: HeroProps) {
  const cover = useGlass({ radius: 36 })

  return (
    <section
      id="top"
      className="relative flex min-h-[92dvh] items-center px-5 pb-40 pt-32 sm:px-8"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <motion.p custom={0} initial="hidden" animate="visible" variants={fadeUp} className="eyebrow">
            Планирование свиданий
          </motion.p>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 text-[3rem] text-ink-900 sm:text-6xl md:text-[4.25rem]"
          >
            Успеть
            <br />
            на последний
            <br />
            поезд
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8 max-w-md text-[17px] leading-relaxed text-ink-700"
          >
            Место, время, музыка и десяток мелочей, о которых легко забыть, — в одном месте.
            Не приложение для знакомств, а приложение для того, что происходит после.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <a
              href="#countdown"
              className="rounded-full bg-ink-900 px-7 py-3.5 text-[15px] font-medium text-cream-50 transition duration-300 hover:bg-ink-700 active:scale-[0.97]"
            >
              Назначить вечер
            </a>
            <a
              href="#places"
              className="glass-thin rounded-full px-7 py-3.5 text-[15px] font-medium text-ink-900 transition duration-300 hover:bg-white/70 active:scale-[0.97]"
            >
              Посмотреть места
            </a>
          </motion.div>

          {plan.at && (
            <motion.p
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-10 text-sm text-ink-500"
            >
              <span className="first-letter:uppercase">{formatDateLong(plan.at)}</span>
              {location && <> · {location.name}</>}
            </motion.p>
          )}
        </div>

        {/* «Обложка» — тот же знак, что и в иконке приложения */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass mx-auto grid aspect-square w-full max-w-sm place-items-center rounded-glass-lg p-12 lg:max-w-md"
          {...cover.props}
        >
          {cover.layers}
          <div className="w-full">
            <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.42em] text-ink-700">
              The&nbsp;Beginning
            </p>
            <CupidMark className="mx-auto mt-8 w-2/3 text-ink-900" weight={1.9} />
            <p className="mt-8 text-center text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-ink-500">
              Railway Last
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
