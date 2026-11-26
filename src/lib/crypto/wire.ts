import { fromBase64Url, toBase64Url, type Bytes } from './bytes'

/**
 * Pairing messages as short text: for copy-paste, links and QR codes.
 *
 *   HB1.c.<commitment>            invite, initiator → responder
 *   HB1.k.<tag>.<public key>      response, responder → initiator
 *   HB1.r.<tag>.<public key>      reveal, initiator → responder
 *
 * All parts are public. `tag` = start of the commitment: it ties a reply to its invite, so a
 * message from another pairing gets a clear error instead of mismatching numbers later.
 * Not a security check — the commitment and the check number do that.
 * `.` separates parts because base64url never contains it.
 */
export type WireMessage =
  | { kind: 'invite'; commitment: Bytes }
  | { kind: 'response'; tag: string; publicKey: Bytes }
  | { kind: 'reveal'; tag: string; publicKey: Bytes }

const PREFIX = 'HB1'
const COMMITMENT_BYTES = 32
// Uncompressed P-256 point: 0x04 ‖ x ‖ y
const PUBLIC_KEY_BYTES = 65
const TAG_LENGTH = 8

export type WireErrorReason = 'format' | 'version' | 'length'

/** The text is not a pairing message we can read. `reason` picks the message for the person. */
export class WireError extends Error {
  override name = 'WireError'
  readonly reason: WireErrorReason

  constructor(reason: WireErrorReason) {
    super(`Not a pairing message (${reason})`)
    this.reason = reason
  }
}

/** Short id of a pairing, taken from its commitment. */
export function sessionTag(commitment: Bytes): string {
  return toBase64Url(commitment).slice(0, TAG_LENGTH)
}

export function encodeMessage(message: WireMessage): string {
  switch (message.kind) {
    case 'invite':
      return [PREFIX, 'c', toBase64Url(message.commitment)].join('.')
    case 'response':
      return [PREFIX, 'k', message.tag, toBase64Url(message.publicKey)].join('.')
    case 'reveal':
      return [PREFIX, 'r', message.tag, toBase64Url(message.publicKey)].join('.')
  }
}

function bytesOf(text: string, length: number): Bytes {
  let bytes: Bytes
  try {
    bytes = fromBase64Url(text)
  } catch {
    throw new WireError('format')
  }
  if (bytes.length !== length) throw new WireError('length')
  return bytes
}

function tagOf(text: string): string {
  if (!new RegExp(`^[A-Za-z0-9_-]{${String(TAG_LENGTH)}}$`).test(text)) {
    throw new WireError('format')
  }
  return text
}

/**
 * Strict parser: anything unexpected throws `WireError`.
 * Spaces and line breaks are dropped first — messengers like to wrap long text.
 */
export function decodeMessage(text: string): WireMessage {
  const parts = text.replace(/\s+/g, '').split('.')
  const [prefix, kind] = parts
  if (prefix?.startsWith('HB') && prefix !== PREFIX) throw new WireError('version')
  if (prefix !== PREFIX) throw new WireError('format')

  if (kind === 'c' && parts.length === 3) {
    return { kind: 'invite', commitment: bytesOf(parts[2] ?? '', COMMITMENT_BYTES) }
  }
  if ((kind === 'k' || kind === 'r') && parts.length === 4) {
    const tag = tagOf(parts[2] ?? '')
    const publicKey = bytesOf(parts[3] ?? '', PUBLIC_KEY_BYTES)
    return kind === 'k' ? { kind: 'response', tag, publicKey } : { kind: 'reveal', tag, publicKey }
  }
  throw new WireError('format')
}
