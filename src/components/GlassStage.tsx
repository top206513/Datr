import { useEffect, useRef } from 'react'
import { GlassRenderer } from '@/gl/GlassRenderer'
import { tilt } from '@/lib/tilt'

/**
 * Верхняя граница плотности пикселей. Фон гладкий, поэтому лишняя плотность
 * почти не видна, а стоит линейно: на телефоне с 3× экраном ограничение до 1
 * это в девять раз меньше пикселей.
 */
const MAX_SCALE = matchMedia('(pointer: coarse)').matches ? 1 : 1.5
interface GlassStageProps {
  onReady: (ok: boolean) => void
}

/**
 * Холст с фоном приложения: градиент и световые пятна считает шейдер.
 *
 * Панели на холсте не рисуются, и это принципиально. Прокрутка на телефоне
 * идёт в потоке композитора, а холст перерисовывается из главного потока —
 * стекло, нарисованное здесь, всегда отставало бы от своей карточки на
 * кадр-другой и заметно дрожало на ходу. Поэтому материал панелей живёт в
 * DOM и едет вместе с содержимым, а холсту остаётся фон.
 *
 * Фон привязан к вьюпорту, значит при прокрутке он не меняется вовсе —
 * во время скролла здесь не выполняется ни одного кадра.
 */
export function GlassStage({ onReady }: GlassStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new GlassRenderer(canvas)
    if (!renderer.ok) {
      renderer.dispose()
      readyRef.current(false)
      return
    }

    readyRef.current(true)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scale = Math.min(window.devicePixelRatio || 1, MAX_SCALE)
    let lastDraw = 0
    let lastWidth = 0
    let lastHeight = 0
    let frame = 0
    let running = true
    // Собственное время дрейфа: оно идёт, только когда со сценой что-то
    // происходит, поэтому в покое кадр буквально не меняется
    let driftTime = 0
    let lastTiltX = 0
    let lastTiltY = 0

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      if (!running) return

      const delta = now - lastDraw
      const tiltMoved =
        Math.abs(tilt.x - lastTiltX) > 0.008 || Math.abs(tilt.y - lastTiltY) > 0.008
      const resized = window.innerWidth !== lastWidth || window.innerHeight !== lastHeight

      // Фон меняется только от наклона и размера окна. Прокрутка его не
      // трогает — значит во время скролла главный поток здесь свободен,
      // а элементы с backdrop-filter поверх не пересчитывают фильтр.
      if (!tiltMoved && !resized && delta < 1000) return

      if (tiltMoved) driftTime += Math.min(delta, 64) / 1000
      lastTiltX = tilt.x
      lastTiltY = tilt.y
      lastDraw = now

      const width = window.innerWidth
      const height = window.innerHeight
      lastWidth = width
      lastHeight = height

      renderer.resize(width, height, scale)
      renderer.render(reduced ? 0 : driftTime, tilt)
    }

    const onVisibility = () => {
      running = !document.hidden
      lastDraw = 0
    }

    document.addEventListener('visibilitychange', onVisibility)
    frame = requestAnimationFrame(loop)

    const onLost = (event: Event) => {
      event.preventDefault()
      readyRef.current(false)
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1] block h-full w-full"
    />
  )
}
