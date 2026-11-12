/**
 * Time-based one-time codes, RFC 6238 (TOTP) on top of RFC 4226 (HOTP).
 * Uses only Web Crypto — no third-party crypto code.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6238
 * @see https://developer.mozilla.org/docs/Web/API/SubtleCrypto/sign
 */

/** Code lifetime in seconds. Same as authenticator apps. */
export const PERIOD_SECONDS = 30

/** Digits in a shared code. */
export const CODE_DIGITS = 6

export interface TotpOptions {
  /** Seconds per step. Default {@link PERIOD_SECONDS}. */
  period?: number
  /** Code length, 6–8. Default {@link CODE_DIGITS}. */
  digits?: number
}

/** Index of the current 30-second window. */
export function timeStep(unixSeconds: number, period = PERIOD_SECONDS): number {
  return Math.floor(unixSeconds / period)
}

/** Seconds left until the code changes, 1…period. */
export function secondsRemaining(unixSeconds: number, period = PERIOD_SECONDS): number {
  return period - (Math.floor(unixSeconds) % period)
}

/** 8-byte big-endian counter. Number is safe here: steps stay far below 2^53. */
function counterBytes(counter: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, BigInt(counter))
  return bytes
}

/**
 * Imports a raw secret as a non-extractable HMAC-SHA-256 key.
 * Non-extractable: page scripts can sign with it but cannot read the bytes back.
 */
export function importSecret(secret: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

/** HOTP with dynamic truncation (RFC 4226 §5.3). */
export async function hotp(key: CryptoKey, counter: number, digits = CODE_DIGITS): Promise<string> {
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) {
    throw new RangeError('digits must be 6, 7 or 8')
  }
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes(counter)))
  // Last nibble picks where to read 4 bytes
  const offset = (mac[mac.length - 1] ?? 0) & 0x0f
  const view = new DataView(mac.buffer, offset, 4)
  const binary = view.getUint32(0) & 0x7fffffff
  return String(binary % 10 ** digits).padStart(digits, '0')
}

/** TOTP code for a moment in time. */
export function totp(
  key: CryptoKey,
  unixSeconds: number,
  options: TotpOptions = {},
): Promise<string> {
  const { period = PERIOD_SECONDS, digits = CODE_DIGITS } = options
  return hotp(key, timeStep(unixSeconds, period), digits)
}

/**
 * Checks a spoken code against the current window and its neighbours (±window steps).
 * The window covers clock drift between phones and the time it takes to say the code.
 * Comparison is over all candidates, so timing does not reveal which window matched.
 */
export async function verifyTotp(
  key: CryptoKey,
  candidate: string,
  unixSeconds: number,
  options: TotpOptions & { window?: number } = {},
): Promise<boolean> {
  const { window = 1, ...rest } = options
  const step = timeStep(unixSeconds, rest.period)
  const period = rest.period ?? PERIOD_SECONDS
  const checks: Promise<string>[] = []
  for (let delta = -window; delta <= window; delta++) {
    checks.push(totp(key, (step + delta) * period, rest))
  }
  const codes = await Promise.all(checks)
  let matched = false
  for (const code of codes) {
    if (constantTimeEqual(code, candidate)) matched = true
  }
  return matched
}

/** String compare that does not stop at the first different character. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** "482913" → "482 913": easier to read aloud. */
export function formatCode(code: string): string {
  const middle = Math.ceil(code.length / 2)
  return `${code.slice(0, middle)} ${code.slice(middle)}`
}
