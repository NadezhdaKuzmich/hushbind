import { bytesEqual } from './bytes'
import {
  completeAsInitiator,
  completeAsResponder,
  PairingError,
  respondToPairing,
  startPairing,
} from './pairing'

async function pairHonestly() {
  const alice = await startPairing()
  const bob = await respondToPairing(alice.commitment)
  const aliceDone = await completeAsInitiator(alice.state, bob.publicKey)
  const bobResult = await completeAsResponder(bob.state, aliceDone.reveal)
  return { alice: aliceDone.result, bob: bobResult }
}

describe('pairing', () => {
  it('gives both sides the same secret and SAS', async () => {
    const { alice, bob } = await pairHonestly()
    expect(bytesEqual(alice.pairSecret, bob.pairSecret)).toBe(true)
    expect(alice.sas).toBe(bob.sas)
    expect(alice.sas).toMatch(/^\d{6}$/)
    expect(alice.pairSecret).toHaveLength(32)
    expect([alice.role, bob.role]).toEqual(['initiator', 'responder'])
  })

  it('creates a fresh secret every time', async () => {
    const first = await pairHonestly()
    const second = await pairHonestly()
    expect(bytesEqual(first.alice.pairSecret, second.alice.pairSecret)).toBe(false)
  })

  it('reveals a man in the middle through different SAS values', async () => {
    // Mallory runs one pairing with Alice and another with Bob
    const alice = await startPairing()
    const malloryToBob = await startPairing()
    const bob = await respondToPairing(malloryToBob.commitment)
    const malloryToAlice = await respondToPairing(alice.commitment)

    const aliceDone = await completeAsInitiator(alice.state, malloryToAlice.publicKey)
    const mallorySide = await completeAsInitiator(malloryToBob.state, bob.publicKey)
    const bobResult = await completeAsResponder(bob.state, mallorySide.reveal)

    // Chance of a collision is 1 in 10⁶ — the commitment stops Mallory from grinding keys
    expect(aliceDone.result.sas).not.toBe(bobResult.sas)
  })

  it('rejects a key that differs from the commitment', async () => {
    const alice = await startPairing()
    const other = await startPairing()
    const bob = await respondToPairing(alice.commitment)
    const swapped = await completeAsInitiator(other.state, bob.publicKey)
    await expect(completeAsResponder(bob.state, swapped.reveal)).rejects.toThrow(PairingError)
  })

  it('rejects a public key that is not on the curve', async () => {
    const alice = await startPairing()
    const garbage = new Uint8Array(65).fill(4)
    await expect(completeAsInitiator(alice.state, garbage)).rejects.toThrow()
  })
})
