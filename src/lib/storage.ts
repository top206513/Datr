const PREFIX = 'railway-last:'

/** localStorage может быть недоступен (приватный режим, отключённые cookie). */
function safeStorage(): Storage | null {
  try {
    const probe = '__rl_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

const storage = typeof window === 'undefined' ? null : safeStorage()

export function readState<T>(key: string, fallback: T): T {
  if (!storage) return fallback
  try {
    const raw = storage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeState<T>(key: string, value: T): void {
  if (!storage) return
  try {
    storage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* Квота исчерпана — тихо продолжаем работать без сохранения. */
  }
}

export const STORAGE_KEYS = {
  plan: 'plan',
  checkedItems: 'checked-items',
  customItems: 'custom-items',
  favorites: 'favorites',
  volume: 'volume',
} as const
