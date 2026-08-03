import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  buildDisplacementMap,
  channelMatrix,
  supportsRefraction,
  tuneGlass,
} from '@/lib/liquidGlass'

interface GlassOptions {
  /** Радиус скругления элемента, px — по нему строится кривая линзы */
  radius?: number
  /** Отключить рефракцию (например, для мелких повторяющихся элементов) */
  enabled?: boolean
}

/** Крупная панель размывает фон сильнее — это и читается как толщина стекла. */
function blurFor(size: { w: number; h: number } | null): number {
  if (!size) return 0
  const min = Math.min(size.w, size.h)
  return Math.min(16, Math.max(6, min * 0.07))
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

  const active = enabled && supportsRefraction()

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
    </>
  )

  return { props, layers, refracting: Boolean(filter) }
}

/**
 * Блики живые: их положение зависит от того, куда «наклонён» экран.
 * На телефоне это гироскоп, на десктопе — курсор; если сигнала нет,
 * свет медленно дрейфует сам, чтобы стекло не выглядело плоским.
 */
export function useTilt() {
  useEffect(() => {
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let lastInput = 0
    let frame = 0
    const start = performance.now()

    const clamp = (v: number) => Math.max(-1, Math.min(1, v))

    const onPointer = (e: PointerEvent) => {
      lastInput = performance.now()
      targetX = clamp((e.clientX / window.innerWidth - 0.5) * 2)
      targetY = clamp((e.clientY / window.innerHeight - 0.5) * 2)
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return
      lastInput = performance.now()
      targetX = clamp(e.gamma / 45)
      targetY = clamp((e.beta - 45) / 45)
    }

    const tick = (now: number) => {
      // Нет ни курсора, ни гироскопа — свет дышит сам
      if (now - lastInput > 2500) {
        const t = (now - start) / 5200
        targetX = Math.sin(t) * 0.55
        targetY = Math.cos(t * 0.78) * 0.4
      }

      currentX += (targetX - currentX) * 0.06
      currentY += (targetY - currentY) * 0.06

      root.style.setProperty('--lg-tx', currentX.toFixed(3))
      root.style.setProperty('--lg-ty', currentY.toFixed(3))

      frame = requestAnimationFrame(tick)
    }

    if (reduced) {
      root.style.setProperty('--lg-tx', '0')
      root.style.setProperty('--lg-ty', '0')
      return
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('deviceorientation', onOrientation)
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('deviceorientation', onOrientation)
      cancelAnimationFrame(frame)
    }
  }, [])
}
