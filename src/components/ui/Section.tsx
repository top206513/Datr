import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  children: ReactNode
}

export function Section({ id, eyebrow, title, description, aside, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-28 px-5 py-16 sm:px-8 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">{eyebrow}</p>
            <h2 className="text-[2.1rem] text-ink-900 sm:text-5xl md:text-[3.4rem]">{title}</h2>
            {description && (
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-700 sm:text-base">
                {description}
              </p>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </motion.header>

        {children}
      </div>
    </section>
  )
}
