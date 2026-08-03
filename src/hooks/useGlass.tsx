import { useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GlassModeContext } from '@/gl/context'
import { registerSurface } from '@/gl/registry'
import {
  buildDisplacementMap,
  channelMatrix,
  supportsRefraction,
  tuneGlass,
} from '@/lib/liquidGlass'
import { startTilt } from '@/lib/tilt'

interface GlassOptions {
  /** Радиус скругления элемента, px — по нему строится кривая линзы */
  radius?: number
  /** Отключить стекло (например, для мелких повторяющихся элементов) */
  enabled?: boolean
  /**
   * Поверхность висит над содержимым страницы, а не над фоном.
   * WebGL не видит пиксели DOM под собой, поэтому такие элементы остаются
   * на backdrop-filter — иначе они перестанут показывать текст за собой.
   */
  overlay?: boolean
  /** Плотность материала, 0–1 */
  tint?: number
  /** Толщина стекла, px — насколько глубоко уходит линза от кромки */
  thickness?: number
}

/** Крупная панель размывает фон сильнее — это и читается как толщина стекла. */
function blurFor(size: { w: number; h: number } | null): number {
  if (!size) return 0
  const min = Math.min(size.w, size.h)
  return Math.min(18, Math.max(9, min * 0.075))
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
export function useGlass({
  radius = 28,
  enabled = true,
  overlay = false,
  tint = 0.4,
  thickness = 34,
}: GlassOptions = {}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ref = useRef<HTMLElement | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  // Поверхности на фоне отдаёт шейдер, всё остальное — SVG-фильтр
  const onStage = useContext(GlassModeContext) && enabled && !overlay
  const active = enabled && !onStage && supportsRefraction()

  useEffect(() => {
    const node = ref.current
    if (!onStage || !node) return

    return registerSurface({ el: node, radius, tint, thickness })
  }, [onStage, radius, tint, thickness])

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
    'data-gl-surface': onStage ? '' : undefined,
    'data-refracting': filter ? '' : undefined,
    style: chain
      ? ({ backdropFilter: chain, WebkitBackdropFilter: chain } as React.CSSProperties)
      : undefined,
  }

  // На сцене все слои материала рисует шейдер — в DOM ничего не нужно
  const layers = onStage ? null : (
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
