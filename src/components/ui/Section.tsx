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
    <section id={id} className="scroll-mt-24 px-5 py-16 sm:px-8 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold-400/80">
              {eyebrow}
            </p>
            <h2 className="text-3xl leading-tight text-mist-100 sm:text-4xl md:text-5xl">{title}</h2>
            {description && (
              <p className="mt-4 text-[15px] leading-relaxed text-mist-300 sm:text-base">
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
