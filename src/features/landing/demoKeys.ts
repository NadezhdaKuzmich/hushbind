import { importSecret } from '../../lib/totp'

/**
 * Demo-only secrets. They are public on purpose: anyone can read them in the bundle.
 * Real secrets are created per pair with ECDH and never leave the device (ADR-3).
 */
const DEMO_SECRETS = {
  /** Shared by "you" and "Mom" in the demo. */
  family: 'hushbind-demo-shared-secret-0',
  /** What a scammer would have: anything but the real secret. */
  stranger: 'hushbind-demo-scammer-guess-1',
} as const

export type DemoKeyName = keyof typeof DEMO_SECRETS

const cache = new Map<DemoKeyName, Promise<CryptoKey>>()

/**
 * Cached promise per key, ready for React 19 `use()`.
 * Must be cached: a new promise per render would suspend forever.
 */
export function getDemoKey(name: DemoKeyName): Promise<CryptoKey> {
  let promise = cache.get(name)
  if (!promise) {
    promise = importSecret(new TextEncoder().encode(DEMO_SECRETS[name]))
    cache.set(name, promise)
  }
  return promise
}
