import { useCallback, useEffect, useState } from 'react'
import { readState, writeState } from '@/lib/storage'

/**
 * `useState`, который переживает перезагрузку страницы.
 * Значение читается из localStorage лениво — один раз при монтировании.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readState(key, initial))

  useEffect(() => {
    writeState(key, value)
  }, [key, value])

  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset] as const
}
