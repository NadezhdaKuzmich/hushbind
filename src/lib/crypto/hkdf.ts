import { utf8, type Bytes } from './bytes'

/**
 * HKDF-SHA-256 (RFC 5869): turns one secret into several independent ones.
 * `info` is the label that makes each output different ("domain separation").
 *
 * @see https://www.rfc-editor.org/rfc/rfc5869
 */
export async function hkdf(
  secret: Bytes,
  salt: Bytes,
  info: string,
  length: number,
): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: utf8(info) },
    key,
    length * 8,
  )
  return new Uint8Array(bits)
}

/** Labels for every derived value. Versioned so the scheme can change without collisions. */
export const LABELS = {
  pairSecret: 'hushbind/v1/pair-secret',
  sas: 'hushbind/v1/sas',
  codeInitiatorToResponder: 'hushbind/v1/code/initiator-to-responder',
  codeResponderToInitiator: 'hushbind/v1/code/responder-to-initiator',
  commitment: 'hushbind/v1/commitment',
} as const
