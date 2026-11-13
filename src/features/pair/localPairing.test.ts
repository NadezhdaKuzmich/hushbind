import { bytesEqual } from '../../lib/crypto'
import {
  attackerChannel,
  begin,
  deliverCommitment,
  deliverResponse,
  deliverReveal,
  directChannel,
  type Channel,
} from './localPairing'

async function runAll(channel: Channel) {
  return deliverReveal(await deliverResponse(await deliverCommitment(await begin(channel))))
}

describe('local pairing', () => {
  it('pairs two phones over a direct channel', async () => {
    const { aResult, bResult } = await runAll(directChannel())
    expect(aResult.role).toBe('initiator')
    expect(bResult.role).toBe('responder')
    expect(aResult.sas).toBe(bResult.sas)
    expect(bytesEqual(aResult.pairSecret, bResult.pairSecret)).toBe(true)
  })

  it('an attacker in the middle makes the SAS differ (T8)', async () => {
    const { aResult, bResult } = await runAll(attackerChannel())
    // Both sides "complete", but each shares a secret with the attacker, not each other
    expect(bytesEqual(aResult.pairSecret, bResult.pairSecret)).toBe(false)
    // 1 in 10⁶ they collide by chance; that is the attacker's whole budget
    expect(aResult.sas).not.toBe(bResult.sas)
  })

  it('the attacker cannot skip steps', async () => {
    const channel = attackerChannel()
    await expect(channel.response(new Uint8Array(65))).rejects.toThrow('Out of order')
  })
})
