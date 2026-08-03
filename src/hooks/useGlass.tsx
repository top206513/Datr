import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  buildDisplacementMap,
  channelMatrix,
  supportsRefraction,
  tuneGlass,
} from '@/lib/liquidGlass'
import { bindTiltTarget, startTilt } from '@/lib/tilt'

interface GlassOptions {
  /** Радиус скругления элемента, px — по нему строится кривая линзы */
  radius?: number
  /** Отключить стекло (например, для мелких повторяющихся элементов) */
  enabled?: boolean
}

/** Крупная панель размывает фон сильнее — это и читается как толщина стекла. */
function blurFor(size: { w: number; h: number } | null): number {
  if (!size) return 0
  const min = Math.min(size.w, size.h)
  return Math.min(18, Math.max(9, min * 0.075))
}

let coarse: boolean | null = null

/** Сенсорный экран: там прокрутка важнее рефракции. */
function isCoarsePointer(): boolean {
  if (coarse === null) coarse = matchMedia('(pointer: coarse)').matches
  return coarse
}

/** Размер округляем до 4 px: иначе фильтр пересобирается на каждый пиксель. */
const QUANTUM = 4
const quantize = (value: number) => Math.round(value / QUANTUM) * QUANTUM

/**
 * Вешает на элемент рефракцию Liquid Glass.
 *
 * Возвращает `props` (ref + inline-стиль с backdrop-filter) и `layers` —
 * фрагмент с самим SVG-фильтром и слоем бликов. Хук, а не компонент-обёртка,
 * потому что стекло нужно на самых разных узлах: motion.div, article, a,
 * form — и подменять им тег было бы неудобно.
 */
export function useGlass({ radius = 28, enabled = true }: GlassOptions = {}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ref = useRef<HTMLElement | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  // Рефракция через SVG-фильтр стоит дорого при прокрутке: браузер
  // пересчитывает её каждый раз, когда элемент проезжает над новым фоном.
  // На сенсорных экранах это заметно, поэтому там остаются размытие, кромка
  // и блик — они композитятся и не трогают главный поток.
  const active = enabled && supportsRefraction() && !isCoarsePointer()

  // Переменные наклона пишутся только в те элементы, что рисуют блик
  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return

    return bindTiltTarget(node)
  }, [enabled])

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !active) return

    const update = (width: number, height: number) => {
      const w = quantize(width)
      const h = quantize(height)
      if (w < 8 || h < 8) return
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }))
    }

    update(node.offsetWidth, node.offsetHeight)

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) update(box.width, box.height)
    })
    observer.observe(node)

    return () => observer.disconnect()
  }, [active])

  const filter = useMemo(() => {
    if (!active || !size) return null

    const tuning = tuneGlass(size.w, size.h)
    const href = buildDisplacementMap({
      width: size.w,
      height: size.h,
      radius,
      band: tuning.band,
      soft: tuning.soft,
    })

    const channels = [
      { key: 'r', scale: tuning.scale * (1 + tuning.chroma) },
      { key: 'g', scale: tuning.scale },
      { key: 'b', scale: tuning.scale * (1 - tuning.chroma) },
    ] as const

    return (
      <svg aria-hidden className="pointer-events-none absolute size-0" focusable="false">
        <filter
          id={id}
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={size.w}
          height={size.h}
          colorInterpolationFilters="sRGB"
        >
          <feImage
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            preserveAspectRatio="none"
            href={href}
            result="map"
          />

          {/* Один и тот же сдвиг, посчитанный трижды с разной силой, —
              это и есть хроматическая аберрация по кромке */}
          {channels.map((channel) => (
            <feDisplacementMap
              key={channel.key}
              in="SourceGraphic"
              in2="map"
              scale={channel.scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result={`d${channel.key}`}
            />
          ))}
          {channels.map((channel) => (
            <feColorMatrix
              key={channel.key}
              in={`d${channel.key}`}
              type="matrix"
              values={channelMatrix(channel.key)}
              result={`c${channel.key}`}
            />
          ))}

          <feBlend in="cr" in2="cg" mode="screen" result="rg" />
          <feBlend in="rg" in2="cb" mode="screen" result="rgb" />
          <feGaussianBlur in="rgb" stdDeviation={tuning.blur} />
        </filter>
      </svg>
    )
  }, [active, size, radius, id])

  // Размытие идёт ПЕРЕД смещением: линза гнёт уже размытый фон. Так за
  // стеклом не остаётся читаемого текста и не нужно глушить рефракцию
  // плотным тинтом — читаемость держит размытие, как в настоящем материале.
  const chain = filter
    ? `blur(${blurFor(size)}px) url(#${id}) saturate(170%) brightness(1.04)`
    : undefined

  const props = {
    ref: ref as React.Ref<never>,
    'data-refracting': filter ? '' : undefined,
    style: chain
      ? ({ backdropFilter: chain, WebkitBackdropFilter: chain } as React.CSSProperties)
      : undefined,
  }

  const layers = (
    <>
      {filter}
      <span aria-hidden className="lg-specular" />
      <span aria-hidden className="lg-rim" />
    </>
  )

  return { props, layers, refracting: Boolean(filter) }
}

/** Подписывает приложение на общий цикл наклона (блики CSS и шейдера). */
export function useTilt() {
  useEffect(() => startTilt(), [])
}
