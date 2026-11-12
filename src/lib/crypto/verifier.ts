import { CODE_DIGITS, verifyTotp } from '../totp'

export type CheckResult =
  | { status: 'match' }
  | { status: 'mismatch'; attemptsLeft: number }
  | { status: 'locked' }
  | { status: 'invalid' }

export interface VerifierOptions {
  /** Wrong codes allowed before locking (threat model T1). */
  maxAttempts?: number
}

/**
 * Checks codes heard on a call, with an attempt limit.
 * After `maxAttempts` wrong codes it stays locked: the UI then tells the person
 * to hang up and call back on a known number.
 */
export function createVerifier(checkKey: CryptoKey, { maxAttempts = 3 }: VerifierOptions = {}) {
  let failures = 0

  return async function check(input: string, unixSeconds: number): Promise<CheckResult> {
    if (failures >= maxAttempts) return { status: 'locked' }
    const code = input.replace(/\s+/g, '')
    // Typos in format don't burn an attempt
    if (!new RegExp(`^\\d{${String(CODE_DIGITS)}}$`).test(code)) return { status: 'invalid' }

    if (await verifyTotp(checkKey, code, unixSeconds)) {
      failures = 0
      return { status: 'match' }
    }
    failures++
    return failures >= maxAttempts
      ? { status: 'locked' }
      : { status: 'mismatch', attemptsLeft: maxAttempts - failures }
  }
}
