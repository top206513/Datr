import { FRAGMENT_SHADER, MAX_PANELS, VERTEX_SHADER } from '@/gl/shaders'

export interface PanelUniform {
  x: number
  y: number
  w: number
  h: number
  radius: number
  tint: number
  thickness: number
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Не удалось собрать шейдер:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

/**
 * Рисует стеклянную сцену одним полноэкранным треугольником.
 *
 * Никаких фреймбуферов и текстур: фон считается формулой прямо во фрагментном
 * шейдере, поэтому преломление — это ещё три вызова той же формулы. Один
 * draw call на кадр, состояние GL настраивается один раз при создании.
 */
export class GlassRenderer {
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null
  private buffer: WebGLBuffer | null = null

  private uRes: WebGLUniformLocation | null = null
  private uScale: WebGLUniformLocation | null = null
  private uTime: WebGLUniformLocation | null = null
  private uTilt: WebGLUniformLocation | null = null
  private uCount: WebGLUniformLocation | null = null
  private uRect: WebGLUniformLocation | null = null
  private uMeta: WebGLUniformLocation | null = null

  private rectData = new Float32Array(MAX_PANELS * 4)
  private metaData = new Float32Array(MAX_PANELS * 4)

  private width = 0
  private height = 0
  private cssWidth = 0
  private cssHeight = 0
  private scale = 1

  constructor(canvas: HTMLCanvasElement) {
    const gl = (canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      // Фон меняется каждый кадр, сохранять его между кадрами незачем
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true,
    }) ?? null) as WebGLRenderingContext | null

    if (!gl) return

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vertex || !fragment) return

    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Не удалось слинковать программу:', gl.getProgramInfoLog(program))
      return
    }

    // Один треугольник с запасом перекрывает экран — дешевле двух
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    gl.useProgram(program)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    this.gl = gl
    this.program = program
    this.buffer = buffer
    this.uRes = gl.getUniformLocation(program, 'uRes')
    this.uScale = gl.getUniformLocation(program, 'uScale')
    this.uTime = gl.getUniformLocation(program, 'uTime')
    this.uTilt = gl.getUniformLocation(program, 'uTilt')
    this.uCount = gl.getUniformLocation(program, 'uCount')
    this.uRect = gl.getUniformLocation(program, 'uRect[0]')
    this.uMeta = gl.getUniformLocation(program, 'uMeta[0]')
  }

  get ok(): boolean {
    return this.gl !== null && this.program !== null
  }

  /** Размер в CSS-пикселях; `scale` — во сколько раз плотнее рисуем. */
  resize(cssWidth: number, cssHeight: number, scale: number): void {
    const gl = this.gl
    if (!gl) return

    const w = Math.max(1, Math.round(cssWidth * scale))
    const h = Math.max(1, Math.round(cssHeight * scale))

    this.cssWidth = cssWidth
    this.cssHeight = cssHeight
    // Масштаб берём фактический: округление размера буфера иначе уводит
    // координаты панелей на доли пикселя
    this.scale = w / cssWidth

    if (w === this.width && h === this.height) return

    this.width = w
    this.height = h
    gl.canvas.width = w
    gl.canvas.height = h
    gl.viewport(0, 0, w, h)
  }

  render(time: number, tilt: { x: number; y: number }, panels: PanelUniform[]): void {
    const gl = this.gl
    if (!gl || !this.program) return

    const count = Math.min(panels.length, MAX_PANELS)

    for (let i = 0; i < count; i++) {
      const panel = panels[i]
      const r = i * 4
      this.rectData[r] = panel.x
      this.rectData[r + 1] = panel.y
      this.rectData[r + 2] = panel.w
      this.rectData[r + 3] = panel.h
      this.metaData[r] = panel.radius
      this.metaData[r + 1] = panel.tint
      this.metaData[r + 2] = panel.thickness
      this.metaData[r + 3] = 0
    }

    gl.uniform2f(this.uRes, this.cssWidth, this.cssHeight)
    gl.uniform1f(this.uScale, this.scale)
    gl.uniform1f(this.uTime, time)
    gl.uniform2f(this.uTilt, tilt.x, tilt.y)
    gl.uniform1i(this.uCount, count)
    gl.uniform4fv(this.uRect, this.rectData)
    gl.uniform4fv(this.uMeta, this.metaData)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose(): void {
    const gl = this.gl
    if (!gl) return

    if (this.program) gl.deleteProgram(this.program)
    if (this.buffer) gl.deleteBuffer(this.buffer)
    gl.getExtension('WEBGL_lose_context')?.loseContext()

    this.gl = null
    this.program = null
    this.buffer = null
  }
}

let supported: boolean | null = null

/** Есть ли вообще WebGL — проверяется один раз за сессию. */
export function supportsWebGL(): boolean {
  if (supported !== null) return supported
  if (typeof document === 'undefined') {
    supported = false
    return supported
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    supported = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    supported = false
  }

  return supported
}
