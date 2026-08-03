/**
 * Liquid Glass: рефракция через карту смещения.
 *
 * Настоящее стекло преломляет фон, а не просто размывает его. В вебе это
 * делается так: рисуется 2D-карта смещения, где красный канал задаёт сдвиг
 * по X, зелёный — по Y (128 = ноль), и `feDisplacementMap` двигает по ней
 * пиксели фона. Карта нейтральна в центре и содержит градиент только по
 * краям — получается линза: середина плоская, края гнутся сильнее всего.
 *
 * Поверх — хроматическая аберрация: тот же сдвиг считается трижды с чуть
 * разной силой для R, G и B, после чего каналы собираются обратно. В
 * реальной линзе разные длины волн преломляются под разными углами, и
 * заметно это только там, где кривизна максимальна, — то есть у кромки.
 */

export interface GlassTuning {
  /** Ширина «линзы» по краю, px */
  band: number
  /** Сила смещения, px */
  scale: number
  /** Размытие карты — насколько плавно линза переходит в плоский центр */
  soft: number
  /** Разброс силы между каналами R/G/B, доля */
  chroma: number
  /** Финальное размытие, px */
  blur: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Толщина стекла зависит от размера элемента: маленькая «пилюля» —
 * тонкое стекло с узкой кромкой, развёрнутая карточка — толще и с
 * заметно более глубокой рефракцией.
 */
export function tuneGlass(width: number, height: number): GlassTuning {
  const min = Math.min(width, height)
  const band = clamp(min * 0.42, 12, 34)

  // У мелкого элемента кромка — это почти весь элемент, и линза может быть
  // сильной: содержимое под пилюлей должно заметно уезжать. У крупной панели
  // плоский центр занимает большую часть, и та же сила смещения рисует по
  // границе видимое «плато». Поэтому чем меньше доля кромки, тем мягче линза.
  const edgeShare = band / min
  const strength = 1.2 + 1.15 * clamp((edgeShare - 0.06) / 0.3, 0, 1)

  return {
    band,
    scale: band * strength,
    // Размытие карты сравнимо с шириной кромки: иначе переход от линзы к
    // плоскому центру виден прямоугольным швом, особенно на гладком фоне.
    soft: band * 1.25,
    chroma: 0.06,
    blur: clamp(min * 0.004, 0.3, 0.9),
  }
}

interface MapOptions {
  width: number
  height: number
  radius: number
  band: number
  soft: number
}

/**
 * Карта смещения как data-URI.
 *
 * Слои снизу вверх: нейтральная заливка → красный градиент слева направо
 * → зелёный поверх него через `screen` (сверху вниз) → нейтральный
 * прямоугольник, гасящий центр. Всё это размывается, чтобы переход от
 * кромки к плоскому центру шёл по кривой, а не ступенькой.
 */
export function buildDisplacementMap({ width, height, radius, band, soft }: MapOptions): string {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const r = clamp(radius, 0, Math.min(w, h) / 2)
  const inner = Math.max(0, r - band)

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>` +
    `<linearGradient id="x" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#f00"/>` +
    `</linearGradient>` +
    `<linearGradient id="y" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#0f0"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="${w}" height="${h}" fill="#808080"/>` +
    `<g filter="blur(${soft.toFixed(1)}px)">` +
    `<rect width="${w}" height="${h}" rx="${r}" fill="url(#x)"/>` +
    `<rect width="${w}" height="${h}" rx="${r}" fill="url(#y)" style="mix-blend-mode:screen"/>` +
    `<rect x="${band.toFixed(1)}" y="${band.toFixed(1)}" width="${Math.max(
      0,
      w - band * 2,
    ).toFixed(1)}" height="${Math.max(0, h - band * 2).toFixed(1)}" rx="${inner.toFixed(
      1,
    )}" fill="#808080"/>` +
    `</g>` +
    `</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Матрица, оставляющая от изображения только один канал. */
export function channelMatrix(channel: 'r' | 'g' | 'b'): string {
  switch (channel) {
    case 'r':
      return '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'
    case 'g':
      return '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'
    case 'b':
      return '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'
  }
}

let cached: boolean | null = null

/**
 * Рефракция работает только там, где `backdrop-filter` принимает ссылку на
 * SVG-фильтр. Сегодня это Chromium; Safari и Firefox получают обычное
 * матовое стекло — оно описано в CSS и включается само.
 */
export function supportsRefraction(): boolean {
  if (cached !== null) return cached
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
    cached = false
    return cached
  }
  cached = CSS.supports('backdrop-filter', 'url(#glass)')
  return cached
}
