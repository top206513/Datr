/**
 * Шейдеры стеклянной сцены.
 *
 * Главный приём, который делает это дешёвым: фон приложения процедурный.
 * Значит, преломление — это не выборка из текстуры и не отдельный проход,
 * а повторный расчёт той же формулы фона в смещённых координатах. Ни одной
 * текстуры, ни одного промежуточного буфера, ни одного чтения из GPU.
 */

export const MAX_PANELS = 8

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
uniform int uCount;
/** x, y, w, h — в пикселях вьюпорта, начало координат сверху слева */
uniform vec4 uRect[${MAX_PANELS}];
/** радиус, тинт, толщина, запас */
uniform vec4 uMeta[${MAX_PANELS}];

const vec3 C_SUN   = vec3(0.984, 0.867, 0.608);
const vec3 C_PEACH = vec3(0.973, 0.749, 0.627);
const vec3 C_ROSE  = vec3(0.941, 0.392, 0.498);
const vec3 C_SUN2  = vec3(0.992, 0.933, 0.769);
const vec3 C_ROSE2 = vec3(0.976, 0.667, 0.698);

/** Колокол без exp(): три умножения вместо трансцендентной функции.
    Форма почти та же, а на мобильном GPU разница ощутима — вызовов девять
    на пиксель, когда считается преломление. */
float blob(vec2 uv, vec2 c, float r) {
  vec2 d = (uv - c) / r;
  float f = max(0.0, 1.0 - dot(d, d) * 0.62);
  return f * f * f;
}

/** Фон: диагональный градиент обложки плюс три медленно дрейфующих пятна. */
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

/** Знаковое расстояние до прямоугольника со скруглением. */
float sdRound(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
}

/** Мягкий минимум: две панели рядом сливаются каплей, а не пересекаются. */
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  // Считаем всё в CSS-пикселях: прямоугольники панелей приходят именно в них,
  // а буфер может быть плотнее или реже — за это отвечает uScale.
  vec2 cssPx = gl_FragCoord.xy / uScale;
  vec2 px = vec2(cssPx.x, uRes.y - cssPx.y);

  float merged = 1e5;
  float nearest = 1e5;
  vec2 normal = vec2(0.0, -1.0);
  float tint = 0.4;
  float thickness = 26.0;

  for (int i = 0; i < ${MAX_PANELS}; i++) {
    if (i >= uCount) break;

    vec4 rect = uRect[i];
    vec2 halfSize = rect.zw * 0.5;
    vec2 local = px - (rect.xy + halfSize);
    float radius = min(uMeta[i].x, min(halfSize.x, halfSize.y));

    float d = sdRound(local, halfSize, radius);
    merged = smin(merged, d, 20.0);

    if (d < nearest) {
      nearest = d;
      // Нормаль считается аналитически: конечные разности стоили бы
      // четырёх лишних проходов по всем панелям на каждый пиксель.
      vec2 q = abs(local) - halfSize + radius;
      vec2 grad = max(q.x, q.y) > 0.0
        ? normalize(max(q, vec2(0.0)))
        : (q.x > q.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
      normal = grad * sign(local + vec2(0.0001));
      tint = uMeta[i].y;
      thickness = uMeta[i].z;
    }
  }

  float d = merged;

  // Снаружи: фон и мягкая тень под панелью
  vec3 outside = background(px);
  outside *= 1.0 - smoothstep(30.0, 0.0, d) * 0.14;

  vec3 col = outside;

  // Внутри и в узкой полосе вокруг кромки считаем стекло
  if (d < 1.0) {
    // 0 у кромки → 1 в глубине; кривизна максимальна у края, как у линзы
    float depth = clamp(-d / thickness, 0.0, 1.0);
    float curve = pow(1.0 - depth, 2.6);

    vec2 offset = normal * curve * thickness * 2.1;

    // Аберрация заметна только у кромки. В глубине панели, где кривизна почти
    // нулевая, хватает одного расчёта фона вместо трёх.
    vec3 refracted = background(px + offset);
    if (curve > 0.05) {
      float aberration = 0.07 * curve;
      refracted.r = background(px + offset * (1.0 + aberration)).r;
      refracted.b = background(px + offset * (1.0 - aberration)).b;
    }

    vec3 glass = mix(refracted, vec3(1.0), tint);

    // Свет приходит со стороны наклона устройства
    vec2 light = normalize(vec2(uTilt.x * 0.9, uTilt.y * 0.7 - 1.0));
    float lambert = max(dot(normal, light), 0.0);

    float rim = smoothstep(2.2, 0.0, abs(d));
    glass += rim * (0.16 + 0.62 * pow(lambert, 1.4));
    glass += pow(lambert, 7.0) * curve * 0.22;
    glass -= 0.055 * curve * max(-dot(normal, light), 0.0);

    col = mix(outside, glass, smoothstep(1.0, -1.0, d));
  }

  gl_FragColor = vec4(col, 1.0);
}
`
