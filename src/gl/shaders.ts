/**
 * Шейдер фона: диагональный градиент обложки и три световых пятна.
 *
 * Панели здесь не рисуются намеренно. Прокрутка на телефоне идёт в потоке
 * композитора, а холст обновляется из главного потока — стекло, нарисованное
 * здесь, отставало бы от своей карточки на кадр-другой и дрожало на ходу.
 * Материал панелей живёт в DOM и едет вместе с содержимым.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

export const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

/** Размер вьюпорта в CSS-пикселях */
uniform vec2 uRes;
/** Во сколько раз буфер плотнее CSS-пикселей */
uniform float uScale;
uniform float uTime;
uniform vec2 uTilt;

const vec3 C_SUN   = vec3(0.984, 0.867, 0.608);
const vec3 C_PEACH = vec3(0.973, 0.749, 0.627);
const vec3 C_ROSE  = vec3(0.941, 0.392, 0.498);
const vec3 C_SUN2  = vec3(0.992, 0.933, 0.769);
const vec3 C_ROSE2 = vec3(0.976, 0.667, 0.698);

/** Колокол без exp(): три умножения вместо трансцендентной функции. */
float blob(vec2 uv, vec2 c, float r) {
  vec2 d = (uv - c) / r;
  float f = max(0.0, 1.0 - dot(d, d) * 0.62);
  return f * f * f;
}

vec3 background(vec2 px) {
  vec2 uv = px / uRes;
  float t = uTime;

  float g = clamp(uv.x * 0.5 + uv.y * 0.72, 0.0, 1.0);
  vec3 col = mix(C_SUN, C_PEACH, smoothstep(0.0, 0.55, g));
  col = mix(col, C_ROSE, smoothstep(0.45, 1.05, g));

  col = mix(col, C_SUN2, blob(uv, vec2(-0.04 + 0.05 * sin(t * 0.10), -0.10 + 0.04 * cos(t * 0.08)), 0.78) * 0.9);
  col = mix(col, C_ROSE2, blob(uv, vec2(1.04 + 0.05 * cos(t * 0.09), 0.28 + 0.05 * sin(t * 0.07)), 0.72) * 0.75);
  col = mix(col, C_ROSE, blob(uv, vec2(0.34 + 0.05 * sin(t * 0.06), 1.16 + 0.04 * cos(t * 0.05)), 0.88) * 0.55);

  return col;
}

void main() {
  // Считаем в CSS-пикселях: буфер может быть плотнее или реже экрана
  vec2 cssPx = gl_FragCoord.xy / uScale;
  vec2 px = vec2(cssPx.x, uRes.y - cssPx.y);

  // Наклон чуть двигает световые пятна — фон дышит вместе с бликами стекла
  gl_FragColor = vec4(background(px + uTilt * 26.0), 1.0);
}
`
