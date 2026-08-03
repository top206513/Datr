import type { ChecklistGroup, ChecklistItem } from '@/types'

export const GROUP_META: Record<ChecklistGroup, { label: string; icon: string; caption: string }> = {
  before: {
    label: 'За несколько дней',
    icon: '🗓',
    caption: 'То, что нельзя решить в последний момент',
  },
  look: { label: 'Образ', icon: '🧥', caption: 'Чтобы утром ни о чём не думать' },
  day: { label: 'В день свидания', icon: '💐', caption: 'Последние штрихи' },
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'confirm-time',
    title: 'Подтвердить время встречи',
    hint: 'Короткое сообщение накануне вечером — и никакой неопределённости',
    group: 'before',
  },
  {
    id: 'book',
    title: 'Забронировать столик',
    hint: 'Позвонить, а не писать: так сразу видно, есть ли место у окна',
    group: 'before',
  },
  {
    id: 'route',
    title: 'Проверить маршрут и время в пути',
    hint: 'Заложить лишние 15 минут — опоздание портит первые полчаса',
    group: 'before',
  },
  {
    id: 'weather',
    title: 'Посмотреть прогноз погоды',
    hint: 'От него зависит и план, и верхняя одежда',
    group: 'before',
  },
  {
    id: 'plan-b',
    title: 'Придумать план Б',
    hint: 'Место в помещении на случай дождя — в пяти минутах от основного',
    group: 'before',
  },
  {
    id: 'outfit',
    title: 'Выбрать образ',
    hint: 'Примерить заранее целиком, вместе с обувью',
    group: 'look',
  },
  {
    id: 'iron',
    title: 'Погладить рубашку',
    hint: 'Вечером накануне, не утром',
    group: 'look',
  },
  {
    id: 'shoes',
    title: 'Почистить обувь',
    hint: 'Деталь, которую замечают, даже не осознавая',
    group: 'look',
  },
  {
    id: 'perfume',
    title: 'Парфюм — за 20 минут до выхода',
    hint: 'Чтобы верхние ноты успели уйти',
    group: 'look',
  },
  {
    id: 'flowers',
    title: 'Купить цветы',
    hint: 'Нечётное количество, без целлофана — и лучше не розы',
    group: 'day',
  },
  {
    id: 'playlist',
    title: 'Включить плейлист заранее',
    hint: 'Настроение начинается ещё дома',
    group: 'day',
  },
  {
    id: 'cash',
    title: 'Проверить наличные и карту',
    hint: 'В маленьких местах терминал иногда «не работает»',
    group: 'day',
  },
  {
    id: 'battery',
    title: 'Зарядить телефон',
    hint: 'И выключить лишние уведомления',
    group: 'day',
  },
  {
    id: 'early',
    title: 'Выйти на 15 минут раньше',
    hint: 'Прийти первым — самый простой способ начать вечер спокойно',
    group: 'day',
  },
]
