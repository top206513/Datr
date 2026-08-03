import { motion } from 'framer-motion'
import { Section } from '@/components/ui/Section'
import { useGlass } from '@/hooks/useGlass'

const PRINCIPLES = [
  {
    index: '01',
    title: 'Детали важнее масштаба',
    text: 'Запоминается не дорогой ресторан, а то, что вы помните, какой кофе она пьёт. Приложение хранит именно такие мелочи.',
  },
  {
    index: '02',
    title: 'Атмосфера начинается заранее',
    text: 'За два часа до выхода, когда играет нужная музыка и вы гладите рубашку. Поэтому плеер здесь — не украшение.',
  },
  {
    index: '03',
    title: 'Ожидание — часть свидания',
    text: 'Отсчёт превращает «когда-нибудь встретимся» в конкретную пятницу, 19:30. Дальше отступать некуда.',
  },
]

function Principle({ item, index }: { item: (typeof PRINCIPLES)[number]; index: number }) {
  const glass = useGlass({ radius: 28 })

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-glass p-7 transition-transform duration-500 hover:-translate-y-1"
      {...glass.props}
    >
      {glass.layers}
      <span className="text-xs font-semibold tabular-nums tracking-widest text-ink-400">
        {item.index}
      </span>
      <h3 className="mt-5 text-2xl text-ink-900">{item.title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{item.text}</p>
    </motion.article>
  )
}

export function Story() {
  return (
    <Section
      id="story"
      eyebrow="Замысел"
      title="Всё началось с вечера, к которому очень готовились"
      description="Список мест в заметках, будильник «купить цветы», плейлист, собранный за неделю, и страх перепутать время. Из этого беспорядка выросло приложение, которое держит всю подготовку в одном месте — и оставляет вам только сам вечер."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {PRINCIPLES.map((item, i) => (
          <Principle key={item.title} item={item} index={i} />
        ))}
      </div>

      <motion.blockquote
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="mx-auto mt-16 max-w-2xl text-center"
      >
        <p className="text-[1.75rem] font-semibold leading-snug tracking-tight text-ink-900 sm:text-4xl">
          «Последний поезд уходит в 00:41.
          <br />
          Всё, что нужно успеть до него, —&nbsp;здесь».
        </p>
      </motion.blockquote>
    </Section>
  )
}
