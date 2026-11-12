/** Byte helpers shared by the crypto core. No dependencies, works in browsers and React Native. */

export type Bytes = Uint8Array<ArrayBuffer>

const encoder = new TextEncoder()

/** UTF-8 encode. */
export function utf8(text: string): Bytes {
  return encoder.encode(text)
}

/** Join byte arrays into one. */
export function concat(...parts: readonly Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** Compare without stopping at the first difference (no timing hint). */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}

/** Cryptographically secure random bytes. */
export function randomBytes(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}

/** URL- and QR-safe Base64 without padding (RFC 4648 §5). */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** Inverse of {@link toBase64Url}. Throws on invalid input. */
export function fromBase64Url(text: string): Bytes {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new TypeError('Invalid base64url')
  const base64 = text.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/** SHA-256 digest. */
export async function sha256(data: Uint8Array<ArrayBuffer>): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data))
}
