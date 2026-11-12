import { bytesEqual, concat, sha256, utf8, type Bytes } from './bytes'
import { hkdf, LABELS } from './hkdf'

/**
 * Pairing two devices: ECDH P-256 with a hash commitment and a 6-digit SAS.
 *
 * Messages (any channel — QR, link, server relay; all public):
 *   1. initiator → responder: commitment = SHA-256(label ‖ initiatorPublicKey)
 *   2. responder → initiator: responderPublicKey
 *   3. initiator → responder: initiatorPublicKey (reveal)
 * Then both people compare the SAS out loud or on video.
 *
 * Why the commitment: without it, a man in the middle can try ~10⁶ keys offline until
 * both SAS values match. Committing first fixes the initiator's key before the responder's
 * key is known, so a MITM gets one 1-in-10⁶ guess. Same idea as ZRTP (RFC 6189).
 *
 * @see https://www.rfc-editor.org/rfc/rfc6189#section-4.4.1
 */

export type PairingRole = 'initiator' | 'responder'

/** What both sides end with. `pairSecret` goes into the vault; `sas` is shown to the person. */
export interface PairingResult {
  role: PairingRole
  pairSecret: Bytes
  sas: string
}

const ECDH = { name: 'ECDH', namedCurve: 'P-256' } as const
const SAS_DIGITS = 6

interface KeyPair {
  privateKey: CryptoKey
  publicKey: Bytes
}

async function generateKeyPair(): Promise<KeyPair> {
  // Private key is non-extractable: it can derive, never be read
  const pair = await crypto.subtle.generateKey(ECDH, false, ['deriveBits'])
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))
  return { privateKey: pair.privateKey, publicKey }
}

/** Web Crypto validates the point is on the curve, so invalid-curve attacks throw here. */
async function importPeerKey(raw: Bytes): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, ECDH, false, [])
}

async function commitmentFor(publicKey: Bytes): Promise<Bytes> {
  return sha256(concat(utf8(LABELS.commitment), publicKey))
}

/** Shared secret → pair secret + SAS, bound to both public keys in a fixed order. */
async function derive(
  role: PairingRole,
  privateKey: CryptoKey,
  initiatorKey: Bytes,
  responderKey: Bytes,
): Promise<PairingResult> {
  const peer = role === 'initiator' ? responderKey : initiatorKey
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: await importPeerKey(peer) },
      privateKey,
      256,
    ),
  )
  const transcript = await sha256(concat(initiatorKey, responderKey))
  const pairSecret = await hkdf(shared, transcript, LABELS.pairSecret, 32)
  const sasBytes = await hkdf(shared, transcript, LABELS.sas, 4)
  // 2³² mod 10⁶ bias is ~0.02 %, irrelevant for a one-shot comparison
  const sasNumber = new DataView(sasBytes.buffer).getUint32(0) % 10 ** SAS_DIGITS
  return { role, pairSecret, sas: String(sasNumber).padStart(SAS_DIGITS, '0') }
}

/** Step 1, initiator. Keep `state` in memory only; send `commitment`. */
export async function startPairing() {
  const keys = await generateKeyPair()
  return { commitment: await commitmentFor(keys.publicKey), state: keys }
}

export type InitiatorState = Awaited<ReturnType<typeof startPairing>>['state']

/** Step 2, responder. Store the commitment, send `publicKey`. */
export async function respondToPairing(commitment: Bytes) {
  const keys = await generateKeyPair()
  return { publicKey: keys.publicKey, state: { ...keys, commitment } }
}

export type ResponderState = Awaited<ReturnType<typeof respondToPairing>>['state']

/** Step 3, initiator. Send `reveal` (own public key) and show `result.sas`. */
export async function completeAsInitiator(state: InitiatorState, responderKey: Bytes) {
  const result = await derive('initiator', state.privateKey, state.publicKey, responderKey)
  return { reveal: state.publicKey, result }
}

/** Step 3, responder. Throws if the revealed key does not match the commitment. */
export async function completeAsResponder(
  state: ResponderState,
  initiatorKey: Bytes,
): Promise<PairingResult> {
  if (!bytesEqual(await commitmentFor(initiatorKey), state.commitment)) {
    throw new PairingError('Commitment mismatch: the key changed during pairing')
  }
  return derive('responder', state.privateKey, initiatorKey, state.publicKey)
}

export class PairingError extends Error {
  override name = 'PairingError'
}
