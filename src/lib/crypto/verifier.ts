import { CODE_DIGITS, verifyTotp } from '../totp'

export type CheckResult =
  | { status: 'match' }
  | { status: 'mismatch'; attemptsLeft: number }
  /** Too many wrong codes. `unlocksAt` is Unix seconds. */
  | { status: 'locked'; unlocksAt: number }
  | { status: 'invalid' }

export interface VerifierOptions {
  /** Wrong codes allowed before locking (threat model T1). */
  maxAttempts?: number
  /** How long the lock lasts. Long enough to hang up and call back. */
  lockSeconds?: number
}

export interface Verifier {
  /** Checks a code heard on a call. Format errors don't burn an attempt. */
  check: (input: string, unixSeconds: number) => Promise<CheckResult>
  /** Unix seconds when the lock ends, or `null` if not locked. Doesn't count as a try. */
  lockedUntil: (unixSeconds: number) => number | null
}

const CODE_PATTERN = new RegExp(`^\\d{${String(CODE_DIGITS)}}$`)

/**
 * Checks codes heard on a call, with an attempt limit and a timed lock.
 * After `maxAttempts` wrong codes it locks for `lockSeconds`: the UI then tells the person
 * to hang up and call back on a known number. A timed lock, not a permanent one:
 * the next real call next week must still be checkable.
 * Time is passed in, never read inside: the verifier stays pure and easy to test.
 */
export function createVerifier(
  checkKey: CryptoKey,
  { maxAttempts = 3, lockSeconds = 300 }: VerifierOptions = {},
): Verifier {
  let failures = 0
  let lockedAt: number | null = null

  function lockedUntil(unixSeconds: number): number | null {
    if (lockedAt === null) return null
    const until = lockedAt + lockSeconds
    if (unixSeconds < until) return until
    // Lock is over: start fresh
    lockedAt = null
    failures = 0
    return null
  }

  async function check(input: string, unixSeconds: number): Promise<CheckResult> {
    const until = lockedUntil(unixSeconds)
    if (until !== null) return { status: 'locked', unlocksAt: until }

    const code = input.replace(/\s+/g, '')
    if (!CODE_PATTERN.test(code)) return { status: 'invalid' }

    if (await verifyTotp(checkKey, code, unixSeconds)) {
      failures = 0
      return { status: 'match' }
    }
    failures++
    if (failures >= maxAttempts) {
      lockedAt = unixSeconds
      return { status: 'locked', unlocksAt: unixSeconds + lockSeconds }
    }
    return { status: 'mismatch', attemptsLeft: maxAttempts - failures }
  }

  return { check, lockedUntil }
}
