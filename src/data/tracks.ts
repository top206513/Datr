import type { Track } from '@/types'

/**
 * Треки не хранятся файлами — они собираются в браузере через Web Audio API.
 * Каждый трек описан как «партитура»: сетка аккордов + мелодическая фраза.
 * Так плеер работает офлайн, весит ноль байт и звучит по-разному каждый раз,
 * оставаясь при этом узнаваемым.
 *
 * Настроение подобрано под светлый градиент интерфейса: мажор, воздух,
 * минимум шумовой подложки. Меланхолия оставлена ровно одному треку.
 */

/** I – vi – IV – V: самая «влюблённая» сетка в поп-музыке */
const MAJOR_POP = [
  [0, 4, 7, 11],
  [9, 12, 16, 19],
  [5, 9, 12, 16],
  [7, 11, 14, 17],
]

/** I – V – vi – IV: та же светлая гармония, но с другим порядком */
const MAJOR_BRIGHT = [
  [0, 4, 7, 11],
  [7, 11, 14, 18],
  [9, 12, 16, 19],
  [5, 9, 12, 16],
]

/** vi – IV – I – V: мажорная сетка, начатая с грустной ступени */
const BITTERSWEET = [
  [9, 12, 16],
  [5, 9, 12, 16],
  [0, 4, 7, 11],
  [7, 11, 14],
]

export const TRACKS: Track[] = [
  {
    id: 'counting-days',
    title: 'Считая дни',
    mood: 'светло · в ожидании',
    duration: 204,
    bpm: 100,
    root: 174.61, // F3
    progression: MAJOR_POP,
    melody: [
      12, null, 11, 9, null, 7, 9, null, 11, null, 12, null, 9, null, 7, null, 16, null, 14, 12,
      null, 11, 9, null, 7, null, 9, 11, 12, null, null, null,
    ],
    lead: 'triangle',
    texture: 0.14,
  },
  {
    id: 'second-chance',
    title: 'Второй шанс',
    mood: 'тепло · с надеждой',
    duration: 188,
    bpm: 112,
    root: 196.0, // G3
    progression: MAJOR_BRIGHT,
    melody: [
      7, 9, 11, null, 12, null, 14, null, 12, 11, null, 9, 7, null, 9, null, 12, 14, 16, null, 14,
      null, 12, 11, 9, null, 11, null, 7, null, null, null,
    ],
    lead: 'triangle',
    texture: 0.1,
  },
  {
    id: 'pink-afternoon',
    title: 'Розовый полдень',
    mood: 'медленно · солнечно',
    duration: 226,
    bpm: 84,
    root: 155.56, // E♭3
    progression: MAJOR_POP,
    melody: [
      4, null, 7, null, 9, null, 7, null, 12, null, 11, null, 9, null, 7, null, 9, null, 12, null,
      14, null, 12, null, 11, null, 9, null, 7, null, null, null,
    ],
    lead: 'sine',
    texture: 0.22,
  },
  {
    id: 'arrow-missed',
    title: 'Стрела мимо',
    mood: 'грустно · но красиво',
    duration: 212,
    bpm: 76,
    root: 146.83, // D3
    progression: BITTERSWEET,
    melody: [
      9, null, 12, 11, null, 9, 7, null, 4, null, 7, 9, null, 7, 4, null, 12, 11, null, 9, 12,
      null, 11, 9, null, 7, 9, null, 4, null, null, null,
    ],
    lead: 'sine',
    texture: 0.38,
  },
]
