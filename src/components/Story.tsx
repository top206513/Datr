import { motion } from 'framer-motion'
import { Section } from '@/components/ui/Section'

const PRINCIPLES = [
  {
    icon: '🕯',
    title: 'Детали важнее масштаба',
    text: 'Запоминается не дорогой ресторан, а то, что вы помните, какой кофе она пьёт. Приложение хранит именно такие мелочи.',
  },
  {
    icon: '🎼',
    title: 'Атмосфера начинается заранее',
    text: 'За два часа до выхода, когда играет нужная музыка и вы гладите рубашку. Поэтому плеер здесь — не украшение.',
  },
  {
    icon: '⏳',
    title: 'Ожидание — часть свидания',
    text: 'Отсчёт превращает «когда-нибудь встретимся» в конкретную пятницу, 19:30. Дальше отступать некуда.',
  },
]

export function Story() {
  return (
    <Section
      id="story"
      eyebrow="Замысел"
      title={
        <>
          Всё началось с одного вечера, <br className="hidden sm:block" />
          <span className="text-gradient">к которому очень готовились</span>
        </>
      }
      description="Список мест в заметках, будильник «купить цветы», плейлист, собранный за неделю, и страх перепутать время. Из этого беспорядка выросло приложение, которое держит всю подготовку в одном месте — и оставляет вам только сам вечер."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((item, i) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="glass group relative overflow-hidden rounded-xl2 p-6 sm:p-7"
          >
            <div
              aria-hidden
              className="absolute -right-10 -top-10 size-32 rounded-full bg-wine-500/10 blur-2xl transition-all duration-700 group-hover:bg-gold-400/15"
            />
            <span aria-hidden className="relative text-3xl">
              {item.icon}
            </span>
            <h3 className="relative mt-4 font-display text-2xl text-mist-100">{item.title}</h3>
            <p className="relative mt-2.5 text-sm leading-relaxed text-mist-300">{item.text}</p>
          </motion.article>
        ))}
      </div>

      <div className="hairline mx-auto mt-14 max-w-3xl" />

      <motion.blockquote
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="mx-auto mt-10 max-w-2xl text-center"
      >
        <p className="font-display text-2xl italic leading-relaxed text-mist-100 sm:text-3xl">
          «Последний поезд уходит в 00:41. Всё, что нужно успеть до него, —&nbsp;здесь».
        </p>
      </motion.blockquote>
    </Section>
  )
}
