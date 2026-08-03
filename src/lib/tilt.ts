/**
 * Наклон устройства — общий источник для бликов.
 *
 * Значение нужно и CSS-слоям (через переменные), и WebGL-шейдеру (числом),
 * поэтому цикл живёт вне React: один rAF на всё приложение.
 */

export const tilt = { x: 0, y: 0 }

/**
 * Элементы, которым переменные наклона действительно нужны, — те, что рисуют
 * блик и кромку через CSS.
 *
 * Раньше переменные писались в <html>. Они наследуемые, поэтому каждая запись
 * инвалидировала стиль всего документа: в профиле пересчёт стилей занимал
 * больше половины времени кадра. Теперь запись идёт только в те узлы, которым
 * она нужна, и не чаще, чем глаз способен заметить.
 */
const targets = new Set<HTMLElement>()

export function bindTiltTarget(el: HTMLElement): () => void {
  targets.add(el)
  written = -2
  return () => {
    targets.delete(el)
  }
}

let written = -2
let writtenY = -2

function publish(x: number, y: number): void {
  if (targets.size === 0) return
  if (Math.abs(x - written) < 0.02 && Math.abs(y - writtenY) < 0.02) return

  written = x
  writtenY = y
  const angle = ((Math.atan2(y, x) * 180) / Math.PI - 90).toFixed(1)
  const tx = x.toFixed(3)
  const ty = y.toFixed(3)

  for (const el of targets) {
    el.style.setProperty('--lg-tx', tx)
    el.style.setProperty('--lg-ty', ty)
    el.style.setProperty('--lg-a', angle)
  }
}

let listeners = 0
let stop: (() => void) | null = null

function begin(): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced) {
    publish(0, 0)
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

  let lastPublish = 0

  const tick = (now: number) => {
    // Нет ни курсора, ни гироскопа — свет дышит сам
    if (now - lastInput > 2500) {
      const t = (now - start) / 5200
      targetX = Math.sin(t) * 0.55
      targetY = Math.cos(t * 0.78) * 0.4
    }

    // Значение для шейдера обновляем каждый кадр: это просто число, ничего
    // не стоит. В DOM пишем в несколько раз реже — там за каждую запись
    // платит пересчёт стилей.
    tilt.x += (targetX - tilt.x) * 0.06
    tilt.y += (targetY - tilt.y) * 0.06

    if (now - lastPublish > 70) {
      lastPublish = now
      publish(tilt.x, tilt.y)
    }

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
