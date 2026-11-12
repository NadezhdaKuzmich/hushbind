import { totp } from '../totp'
import { deriveDirectionalKeys } from './directional'
import { completeAsInitiator, completeAsResponder, respondToPairing, startPairing } from './pairing'

async function pairedKeys() {
  const a = await startPairing()
  const b = await respondToPairing(a.commitment)
  const aDone = await completeAsInitiator(a.state, b.publicKey)
  const bResult = await completeAsResponder(b.state, aDone.reveal)
  return {
    son: await deriveDirectionalKeys(aDone.result.pairSecret, 'initiator'),
    mom: await deriveDirectionalKeys(bResult.pairSecret, 'responder'),
  }
}

const NOW = 1_800_000_000

describe('directional keys', () => {
  it('lets each side check the code the other one says', async () => {
    const { son, mom } = await pairedKeys()
    expect(await totp(son.proveKey, NOW)).toBe(await totp(mom.checkKey, NOW))
    expect(await totp(mom.proveKey, NOW)).toBe(await totp(son.checkKey, NOW))
  })

  it('blocks the reverse attack: Mom’s code never proves her son (T2)', async () => {
    const { son, mom } = await pairedKeys()
    const momSays = await totp(mom.proveKey, NOW)
    expect(momSays).not.toBe(await totp(son.proveKey, NOW))
  })

  it('makes the keys non-extractable', async () => {
    const { son } = await pairedKeys()
    expect(son.proveKey.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', son.proveKey)).rejects.toThrow()
  })
})
