import type { PanelUniform } from '@/gl/GlassRenderer'
import { MAX_PANELS } from '@/gl/shaders'

export interface GlassSurface {
  el: HTMLElement
  radius: number
  tint: number
  thickness: number
}

const surfaces = new Set<GlassSurface>()

/** Регистрирует поверхность в стеклянной сцене; возвращает отписку. */
export function registerSurface(surface: GlassSurface): () => void {
  surfaces.add(surface)
  return () => {
    surfaces.delete(surface)
  }
}

export function surfaceCount(): number {
  return surfaces.size
}

/**
 * Собирает видимые панели для шейдера.
 *
 * Все `getBoundingClientRect` делаются здесь подряд, одним блоком чтения —
 * между ними ничего не пишется в DOM, поэтому лишних пересчётов раскладки нет.
 * За кадр в шейдер уходит не больше MAX_PANELS панелей: если на экране их
 * оказалось больше, берутся самые крупные — мелкие всё равно не видно.
 */
export function collectPanels(viewportWidth: number, viewportHeight: number): PanelUniform[] {
  const visible: PanelUniform[] = []

  for (const surface of surfaces) {
    const el = surface.el
    if (!el.isConnected) continue

    const rect = el.getBoundingClientRect()
    if (rect.width < 4 || rect.height < 4) continue

    // Отбрасываем всё, что за пределами экрана, с небольшим запасом на тень
    if (
      rect.bottom < -40 ||
      rect.top > viewportHeight + 40 ||
      rect.right < -40 ||
      rect.left > viewportWidth + 40
    ) {
      continue
    }

    visible.push({
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      radius: surface.radius,
      tint: surface.tint,
      thickness: Math.min(surface.thickness, Math.min(rect.width, rect.height) * 0.42),
    })
  }

  if (visible.length > MAX_PANELS) {
    visible.sort((a, b) => b.w * b.h - a.w * a.h)
    visible.length = MAX_PANELS
  }

  return visible
}
