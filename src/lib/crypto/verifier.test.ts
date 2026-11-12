import { importSecret, totp } from '../totp'
import { createVerifier } from './verifier'

const NOW = 1_800_000_000

async function setup(maxAttempts?: number) {
  const key = await importSecret(new Uint8Array(32).fill(7))
  const check = createVerifier(key, maxAttempts === undefined ? {} : { maxAttempts })
  const good = await totp(key, NOW)
  const bad = good === '000000' ? '111111' : '000000'
  return { check, good, bad }
}

describe('createVerifier', () => {
  it('accepts the right code, with spaces as people read it', async () => {
    const { check, good } = await setup()
    await expect(check(`${good.slice(0, 3)} ${good.slice(3)}`, NOW)).resolves.toEqual({
      status: 'match',
    })
  })

  it('counts down and locks after 3 wrong codes (T1)', async () => {
    const { check, good, bad } = await setup()
    await expect(check(bad, NOW)).resolves.toEqual({ status: 'mismatch', attemptsLeft: 2 })
    await expect(check(bad, NOW)).resolves.toEqual({ status: 'mismatch', attemptsLeft: 1 })
    await expect(check(bad, NOW)).resolves.toEqual({ status: 'locked' })
    // Even the right code is refused once locked
    await expect(check(good, NOW)).resolves.toEqual({ status: 'locked' })
  })

  it('does not burn an attempt on a malformed code', async () => {
    const { check, bad } = await setup(1)
    await expect(check('12a', NOW)).resolves.toEqual({ status: 'invalid' })
    await expect(check(bad, NOW)).resolves.toEqual({ status: 'locked' })
  })
})
