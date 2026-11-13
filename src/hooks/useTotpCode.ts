import { useEffect, useState } from 'react'
import { PERIOD_SECONDS, secondsRemaining, timeStep, totp } from '../lib/totp'

export interface TotpState {
  /** Current code, `null` until the first one is computed. */
  code: string | null
  /** Seconds until the next code, 1…30. */
  secondsLeft: number
}

const nowSeconds = () => Date.now() / 1000

/** A computed code remembers its key, so it is never shown for a different one. */
interface Computed {
  key: CryptoKey
  code: string
}

/**
 * Live TOTP code for a key: ticks every second, recomputes only when the window changes.
 * The `cancelled` flag drops results that arrive after unmount or a key change.
 */
export function useTotpCode(key: CryptoKey | null): TotpState {
  const [now, setNow] = useState(nowSeconds)
  const [computed, setComputed] = useState<Computed | null>(null)
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
    void totp(key, step * PERIOD_SECONDS).then((code) => {
      if (!cancelled) setComputed({ key, code })
    })
    return () => {
      cancelled = true
    }
  }, [key, step])

  // After a key change the old code stays in state until the new one is ready: hide it
  const code = key && computed?.key === key ? computed.code : null
  return { code, secondsLeft: secondsRemaining(now) }
}
