import { useEffect, useState } from 'react'
import { PERIOD_SECONDS, secondsRemaining, timeStep, totp } from '../lib/totp'

export interface TotpState {
  /** Current code, `null` until the first one is computed. */
  code: string | null
  /** Seconds until the next code, 1…30. */
  secondsLeft: number
}

const nowSeconds = () => Date.now() / 1000

/**
 * Live TOTP code for a key: ticks every second, recomputes only when the window changes.
 * The `cancelled` flag drops results that arrive after unmount or a key change.
 */
export function useTotpCode(key: CryptoKey | null): TotpState {
  const [now, setNow] = useState(nowSeconds)
  const [code, setCode] = useState<string | null>(null)
  const step = timeStep(now)

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(nowSeconds())
    }, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!key) return
    let cancelled = false
    void totp(key, step * PERIOD_SECONDS).then((next) => {
      if (!cancelled) setCode(next)
    })
    return () => {
      cancelled = true
    }
  }, [key, step])

  return { code: key ? code : null, secondsLeft: secondsRemaining(now) }
}
