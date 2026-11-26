import { bytesEqual, decodeMessage, encodeMessage, startPairing } from '../../lib/crypto'
import {
  INVITE_TTL_SECONDS,
  joinWithInvite,
  receiveResponse,
  receiveReveal,
  RemotePairingError,
  startAsInitiator,
} from './remoteSession'

const NOW = 1_800_000_000

async function problemOf(work: Promise<unknown>) {
  try {
    await work
  } catch (error) {
    return error instanceof RemotePairingError ? error.problem : 'other'
  }
  return 'ok'
}

/** Two phones, only text between them. */
async function pairOverText() {
  const a = await startAsInitiator(NOW)
  const b = await joinWithInvite(a.outgoing, NOW + 5)
  const aDone = await receiveResponse(a, b.outgoing, NOW + 10)
  const bDone = await receiveReveal(b, aDone.outgoing, NOW + 15)
  return { a, b, aDone, bDone }
}

describe('remote pairing', () => {
  it('pairs two phones with nothing but text messages', async () => {
    const { aDone, bDone } = await pairOverText()
    expect(aDone.result.sas).toBe(bDone.result.sas)
    expect(bytesEqual(aDone.result.pairSecret, bDone.result.pairSecret)).toBe(true)
    expect([aDone.result.role, bDone.result.role]).toEqual(['initiator', 'responder'])
  })

  it('names a message sent at the wrong step', async () => {
    const a = await startAsInitiator(NOW)
    expect(await problemOf(receiveResponse(a, a.outgoing, NOW))).toBe('wrongKind')
    expect(await problemOf(joinWithInvite('hello', NOW))).toBe('format')
  })

  it('refuses a reply from another pairing', async () => {
    const a = await startAsInitiator(NOW)
    const other = await startAsInitiator(NOW)
    const b = await joinWithInvite(other.outgoing, NOW)
    expect(await problemOf(receiveResponse(a, b.outgoing, NOW))).toBe('otherSession')
  })

  it('expires after 10 minutes on either phone (T10)', async () => {
    const a = await startAsInitiator(NOW)
    const b = await joinWithInvite(a.outgoing, NOW)
    expect(await problemOf(receiveResponse(a, b.outgoing, NOW + INVITE_TTL_SECONDS + 1))).toBe(
      'expired',
    )
    const fresh = await receiveResponse(a, b.outgoing, NOW + INVITE_TTL_SECONDS)
    expect(await problemOf(receiveReveal(b, fresh.outgoing, NOW + INVITE_TTL_SECONDS + 1))).toBe(
      'expired',
    )
  })

  it('catches a swapped key at the reveal (commitment check)', async () => {
    const { b, aDone } = await pairOverText()
    // Someone in the middle replaces A's revealed key with their own
    const { tag } = decodeMessage(aDone.outgoing) as { tag: string }
    const intruder = await startPairing()
    const swapped = encodeMessage({ kind: 'reveal', tag, publicKey: intruder.state.publicKey })
    expect(await problemOf(receiveReveal(b, swapped, NOW + 20))).toBe('keyChanged')
  })

  it('refuses a key that is not on the curve', async () => {
    const a = await startAsInitiator(NOW)
    const b = await joinWithInvite(a.outgoing, NOW)
    const { tag } = decodeMessage(b.outgoing) as { tag: string }
    const offCurve = Uint8Array.from({ length: 65 }, (_, i) => (i === 0 ? 4 : 1))
    const forged = encodeMessage({ kind: 'response', tag, publicKey: offCurve })
    expect(await problemOf(receiveResponse(a, forged, NOW))).toBe('badKey')
  })
})
