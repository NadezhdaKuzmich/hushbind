import { fromBase64Url, randomBytes, toBase64Url, utf8 } from './bytes'

/** Encrypted blob, safe to store anywhere (IndexedDB, server backup). */
export interface Sealed {
  /** Format version. Read from storage, so any number can arrive. */
  v: number
  iv: string
  ct: string
}

const IV_BYTES = 12
const FORMAT_VERSION = 1

/**
 * New AES-256-GCM key for the local vault. Non-extractable: it can be stored in
 * IndexedDB as a CryptoKey but never read as bytes by page scripts.
 * Stage 2 wraps it with a key from the passkey PRF extension.
 */
export function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

/**
 * Encrypts JSON with AES-GCM. A fresh random IV every time — reusing an IV with the same
 * key breaks GCM completely. `context` is authenticated but not encrypted (AAD): a blob
 * sealed for one purpose fails to open for another.
 */
export async function seal(key: CryptoKey, value: unknown, context: string): Promise<Sealed> {
  const iv = randomBytes(IV_BYTES)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: utf8(context) },
    key,
    utf8(JSON.stringify(value)),
  )
  return { v: FORMAT_VERSION, iv: toBase64Url(iv), ct: toBase64Url(new Uint8Array(ct)) }
}

/** Decrypts and parses. Throws on a wrong key, wrong context or any tampering. */
export async function open<T>(key: CryptoKey, sealed: Sealed, context: string): Promise<T> {
  if (sealed.v !== FORMAT_VERSION) {
    throw new TypeError(`Unsupported vault format v${String(sealed.v)}`)
  }
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(sealed.iv), additionalData: utf8(context) },
    key,
    fromBase64Url(sealed.ct),
  )
  return JSON.parse(new TextDecoder().decode(plain)) as T
}
