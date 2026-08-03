import { createContext } from 'react'

/**
 * Активна ли WebGL-сцена. Пока true, поверхности не рисуют материал сами —
 * его берёт на себя шейдер. Значение падает в false, если контекст потерян
 * или шейдер не собрался, и интерфейс возвращается к CSS-стеклу.
 */
export const GlassModeContext = createContext(false)
