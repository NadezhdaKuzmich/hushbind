import { importSecret } from '../totp'
import type { Bytes } from './bytes'
import { hkdf, LABELS } from './hkdf'
import type { PairingRole } from './pairing'

/** Two keys per pair: one to prove "it's me", one to check the other person. */
export interface DirectionalKeys {
  /** Generates the code I say on a call. */
  proveKey: CryptoKey
  /** Checks the code the other person says. */
  checkKey: CryptoKey
}

/**
 * Splits a pair secret into one key per direction (threat model T2).
 * My prove key equals the other side's check key and vice versa, so a code read out
 * by one person never proves the other one.
 */
export async function deriveDirectionalKeys(
  pairSecret: Bytes,
  role: PairingRole,
): Promise<DirectionalKeys> {
  const salt = new Uint8Array(32)
  const [initToResp, respToInit] = await Promise.all([
    hkdf(pairSecret, salt, LABELS.codeInitiatorToResponder, 32),
    hkdf(pairSecret, salt, LABELS.codeResponderToInitiator, 32),
  ])
  const [mine, theirs] = role === 'initiator' ? [initToResp, respToInit] : [respToInit, initToResp]
  const [proveKey, checkKey] = await Promise.all([importSecret(mine), importSecret(theirs)])
  return { proveKey, checkKey }
}
