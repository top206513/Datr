import { useEffect, useState } from 'react'
import { getRemaining, type Remaining } from '@/lib/time'

/**
 * Тикающий таймер до `target`.
 * Считает от системных часов (а не накоплением +1s), поэтому переживает
 * сон вкладки и троттлинг таймеров в фоне.
 */
export function useCountdown(target: string | null): Remaining | null {
  const [remaining, setRemaining] = useState<Remaining | null>(() =>
    target ? getRemaining(target) : null,
  )

  useEffect(() => {
    if (!target) {
      setRemaining(null)
      return
    }

    setRemaining(getRemaining(target))
    const id = window.setInterval(() => setRemaining(getRemaining(target)), 1000)

    const onVisible = () => {
      if (!document.hidden) setRemaining(getRemaining(target))
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [target])

  return remaining
}
