import { useEffect, useRef } from 'react'
import { GlassRenderer } from '@/gl/GlassRenderer'
import { collectPanels } from '@/gl/registry'
import { tilt } from '@/lib/tilt'

/**
 * Верхняя граница плотности пикселей. Фон гладкий, поэтому лишняя плотность
 * почти не видна, а стоит линейно: на телефоне с 3× экраном ограничение до 1
 * это в девять раз меньше пикселей.
 */
const MAX_SCALE = matchMedia('(pointer: coarse)').matches ? 1 : 1.5
const MIN_SCALE = 0.75
/** Кадр дольше этого — качество вниз; стабильно быстрее — обратно вверх. */
const SLOW_FRAME = 20
const FAST_FRAME = 12

interface GlassStageProps {
  onReady: (ok: boolean) => void
}

/**
 * Холст со стеклянной сценой: фон приложения и все поверхности, лежащие
 * на нём, рисуются одним draw call под содержимым страницы.
 *
 * Что сделано ради плавности:
 * — плотность пикселей ограничена и сама падает, если кадры проседают;
 * — кадр пропускается, когда ничего не изменилось (панели на месте, наклон
 *   замер, вкладка неактивна) — фон дышит медленно, ему хватает 30 кадров;
 * — все чтения раскладки собраны в один блок, между ними нет записей;
 * — при уходе вкладки в фон цикл останавливается полностью.
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
    let scale = Math.min(window.devicePixelRatio || 1, MAX_SCALE)
    let frameAverage = 16
    let lastDraw = performance.now()
    let lastActivity = performance.now()
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

      // Во время прокрутки панели едут вместе со страницей: рисуем каждый
      // кадр, иначе стекло отстаёт от своей карточки и «плавает».
      const busy = now - lastActivity < 400
      const delta = now - lastDraw
      const tiltMoved =
        Math.abs(tilt.x - lastTiltX) > 0.008 || Math.abs(tilt.y - lastTiltY) > 0.008

      // Самое дорогое на телефоне — не сама отрисовка холста, а то, что вслед
      // за ней пересчитывают фильтр все элементы с backdrop-filter поверх.
      // Поэтому в покое кадр не рисуется вообще: ничего не меняется, значит
      // и перерисовывать нечего. Раз в секунду — страховочный кадр на случай
      // сдвигов раскладки, которые мы не отследили.
      const changed = busy || tiltMoved
      if (!changed && delta < 1000) return

      if (changed) driftTime += Math.min(delta, 64) / 1000
      lastTiltX = tilt.x
      lastTiltY = tilt.y
      lastDraw = now

      // Качество подстраиваем только в активном режиме: там цель — 16.7 мс
      // на кадр. В спокойном режиме интервал задаём мы сами, и мерить по
      // нему было бы бессмысленно — качество укатилось бы в минимум.
      if (busy) {
        frameAverage += (delta - frameAverage) * 0.12
        if (frameAverage > SLOW_FRAME && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale - 0.25)
          frameAverage = 16
        } else if (frameAverage < FAST_FRAME && scale < MAX_SCALE) {
          scale = Math.min(MAX_SCALE, scale + 0.25)
          frameAverage = 16
        }
      }

      const width = window.innerWidth
      const height = window.innerHeight
      renderer.resize(width, height, scale)

      const panels = collectPanels(width, height)
      renderer.render(reduced ? 0 : driftTime, tilt, panels)
    }

    const wake = () => {
      lastActivity = performance.now()
    }

    const onVisibility = () => {
      running = !document.hidden
      lastDraw = performance.now()
      wake()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', wake, { passive: true })
    window.addEventListener('pointerdown', wake, { passive: true })
    window.addEventListener('orientationchange', wake, { passive: true })
    frame = requestAnimationFrame(loop)

    const onLost = (event: Event) => {
      event.preventDefault()
      readyRef.current(false)
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', wake)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('orientationchange', wake)
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
