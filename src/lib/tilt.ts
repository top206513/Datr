/**
 * Наклон устройства — общий источник для бликов.
 *
 * Значение нужно и CSS-слоям (через переменные), и WebGL-шейдеру (числом),
 * поэтому цикл живёт вне React: один rAF на всё приложение.
 */

export const tilt = { x: 0, y: 0 }

let listeners = 0
let stop: (() => void) | null = null

function begin(): () => void {
  const root = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced) {
    root.style.setProperty('--lg-tx', '0')
    root.style.setProperty('--lg-ty', '0')
    root.style.setProperty('--lg-a', '-45')
    return () => {}
  }

  let targetX = 0
  let targetY = 0
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

    tilt.x += (targetX - tilt.x) * 0.06
    tilt.y += (targetY - tilt.y) * 0.06

    root.style.setProperty('--lg-tx', tilt.x.toFixed(3))
    root.style.setProperty('--lg-ty', tilt.y.toFixed(3))
    root.style.setProperty('--lg-a', ((Math.atan2(tilt.y, tilt.x) * 180) / Math.PI - 90).toFixed(1))

    frame = requestAnimationFrame(tick)
  }

  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('deviceorientation', onOrientation)
  frame = requestAnimationFrame(tick)

  return () => {
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('deviceorientation', onOrientation)
    cancelAnimationFrame(frame)
  }
}

/** Подписка с подсчётом ссылок: цикл запускается один раз на всех. */
export function startTilt(): () => void {
  if (listeners === 0) stop = begin()
  listeners++

  return () => {
    listeners--
    if (listeners === 0) {
      stop?.()
      stop = null
    }
  }
}
