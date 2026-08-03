import { describe, expect, it } from 'vitest'
import { buildDisplacementMap, channelMatrix, tuneGlass } from './liquidGlass'

describe('tuneGlass', () => {
  it('делает стекло тем толще, чем крупнее элемент', () => {
    const pill = tuneGlass(240, 48)
    const card = tuneGlass(420, 300)

    expect(card.band).toBeGreaterThan(pill.band)
    expect(card.scale).toBeGreaterThan(pill.scale)
  })

  it('удерживает кромку в разумных пределах на крайних размерах', () => {
    const tiny = tuneGlass(20, 20)
    const huge = tuneGlass(1600, 900)

    expect(tiny.band).toBeGreaterThanOrEqual(10)
    expect(huge.band).toBeLessThanOrEqual(34)
  })

  it('считает толщину по короткой стороне', () => {
    expect(tuneGlass(1000, 60)).toEqual(tuneGlass(60, 1000))
  })

  it('размывает карту не слабее ширины кромки — иначе виден шов', () => {
    const tuning = tuneGlass(400, 240)
    expect(tuning.soft).toBeGreaterThanOrEqual(tuning.band)
  })

  it('оставляет аберрацию небольшой: сильная читается как радуга', () => {
    expect(tuneGlass(400, 240).chroma).toBeLessThan(0.1)
  })
})

describe('buildDisplacementMap', () => {
  const decode = (uri: string) => decodeURIComponent(uri.replace('data:image/svg+xml;utf8,', ''))

  it('возвращает data-URI с корректным SVG', () => {
    const uri = buildDisplacementMap({ width: 300, height: 160, radius: 28, band: 20, soft: 18 })

    expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true)
    const svg = decode(uri)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('заливает фон нейтральным серым — это нулевое смещение', () => {
    const svg = decode(buildDisplacementMap({ width: 300, height: 160, radius: 28, band: 20, soft: 18 }))
    expect(svg).toContain('fill="#808080"')
  })

  it('кодирует X в красном канале, Y — в зелёном', () => {
    const svg = decode(buildDisplacementMap({ width: 300, height: 160, radius: 28, band: 20, soft: 18 }))

    expect(svg).toContain('stop-color="#f00"')
    expect(svg).toContain('stop-color="#0f0"')
    expect(svg).toContain('mix-blend-mode:screen')
  })

  it('гасит центр прямоугольником, отступив на ширину кромки', () => {
    const svg = decode(buildDisplacementMap({ width: 300, height: 160, radius: 28, band: 20, soft: 18 }))

    expect(svg).toContain('x="20.0" y="20.0" width="260.0" height="120.0"')
  })

  it('не уходит в отрицательные размеры, когда кромка шире элемента', () => {
    const svg = decode(buildDisplacementMap({ width: 24, height: 24, radius: 12, band: 40, soft: 10 }))

    expect(svg).not.toMatch(/(width|height|rx)="-/)
  })

  it('ограничивает радиус половиной короткой стороны', () => {
    const svg = decode(buildDisplacementMap({ width: 200, height: 80, radius: 999, band: 10, soft: 8 }))

    expect(svg).toContain('rx="40"')
  })
})

describe('channelMatrix', () => {
  it('оставляет ровно один канал и полную непрозрачность', () => {
    for (const channel of ['r', 'g', 'b'] as const) {
      const values = channelMatrix(channel).split(/\s+/).map(Number)

      expect(values).toHaveLength(20)
      expect(values.filter((v) => v === 1)).toHaveLength(2) // сам канал + альфа
      expect(values[18]).toBe(1)
    }
  })

  it('разводит каналы по разным строкам матрицы', () => {
    expect(channelMatrix('r')).not.toBe(channelMatrix('g'))
    expect(channelMatrix('g')).not.toBe(channelMatrix('b'))
  })
})

describe('сила линзы', () => {
  it('мягче на крупной панели, чем на мелкой пилюле', () => {
    const pill = tuneGlass(220, 48)
    const panel = tuneGlass(600, 420)

    // сила смещения относительно ширины кромки
    expect(pill.scale / pill.band).toBeGreaterThan(panel.scale / panel.band)
  })

  it('не опускается ниже ширины кромки', () => {
    for (const size of [40, 120, 400, 1200]) {
      const tuning = tuneGlass(size, size)
      expect(tuning.scale).toBeGreaterThan(tuning.band)
    }
  })
})
