import type { Track } from '@/types'

/**
 * Треки не хранятся файлами — они собираются в браузере через Web Audio API.
 * Каждый трек описан как «партитура»: сетка аккордов + мелодическая фраза.
 * Так плеер работает офлайн, весит ноль байт и звучит по-разному каждый раз,
 * оставаясь при этом узнаваемым.
 */

/** i – VI – III – VII, классический «минорный круг» */
const MINOR_CIRCLE = [
  [0, 3, 7, 10],
  [8, 12, 15, 19],
  [3, 7, 10, 14],
  [10, 14, 17, 21],
]

/** i – iv – VI – V, более тревожная сетка */
const MINOR_TENSE = [
  [0, 3, 7],
  [5, 8, 12],
  [8, 12, 15],
  [7, 11, 14],
]

/** I – vi – IV – V, мажорная «нежная» сетка */
const MAJOR_SOFT = [
  [0, 4, 7, 11],
  [9, 12, 16, 19],
  [5, 9, 12, 16],
  [7, 11, 14, 17],
]

export const TRACKS: Track[] = [
  {
    id: 'last-train',
    title: 'Последний поезд',
    mood: 'медленно · тепло · немного грустно',
    duration: 224,
    bpm: 68,
    root: 146.83, // D3
    progression: MINOR_CIRCLE,
    melody: [
      12, null, 15, 14, null, 12, 10, null, 7, null, 10, 12, null, 10, 7, null, 12, 14, null, 15,
      17, null, 15, 12, null, 10, 12, null, 7, null, null, null,
    ],
    lead: 'sine',
    texture: 0.34,
  },
  {
    id: 'lantern-waltz',
    title: 'Фонари на Патриарших',
    mood: 'вальс · золото · вечер',
    duration: 198,
    bpm: 92,
    root: 174.61, // F3
    progression: MAJOR_SOFT,
    melody: [
      7, 9, 11, null, 12, null, 11, 9, 7, null, 4, null, 7, 9, 7, null, 12, 14, 16, null, 14, null,
      12, 11, 9, null, 7, null, 4, null, null, null,
    ],
    lead: 'triangle',
    texture: 0.2,
  },
  {
    id: 'rain-schedule',
    title: 'Дождь по расписанию',
    mood: 'шум дождя · очень тихо',
    duration: 246,
    bpm: 58,
    root: 130.81, // C3
    progression: MINOR_TENSE,
    melody: [
      0, null, null, 3, null, null, 7, null, 5, null, null, 3, null, null, 0, null, 10, null, null,
      7, null, null, 5, null, 3, null, null, 0, null, null, null, null,
    ],
    lead: 'sine',
    texture: 0.72,
  },
  {
    id: 'five-to-midnight',
    title: 'Пять минут до полуночи',
    mood: 'светло · с надеждой',
    duration: 186,
    bpm: 104,
    root: 196.0, // G3
    progression: MAJOR_SOFT,
    melody: [
      12, 11, 9, 7, null, 9, 11, null, 12, 14, null, 12, 11, null, 9, null, 16, null, 14, 12, null,
      11, 9, null, 7, null, 9, 11, 12, null, null, null,
    ],
    lead: 'triangle',
    texture: 0.15,
  },
]
