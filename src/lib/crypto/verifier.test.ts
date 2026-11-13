import { importSecret, totp } from '../totp'
import { createVerifier, type VerifierOptions } from './verifier'

const NOW = 1_800_000_000

async function setup(options: VerifierOptions = {}) {
  const key = await importSecret(new Uint8Array(32).fill(7))
  const { check, lockedUntil } = createVerifier(key, options)
  const good = await totp(key, NOW)
  const bad = good === '000000' ? '111111' : '000000'
  return { key, check, lockedUntil, good, bad }
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
    await expect(check(bad, NOW)).resolves.toEqual({ status: 'locked', unlocksAt: NOW + 300 })
    // Even the right code is refused once locked
    await expect(check(good, NOW)).resolves.toEqual({ status: 'locked', unlocksAt: NOW + 300 })
  })

  it('reports the lock without spending a try', async () => {
    const { check, lockedUntil, bad } = await setup({ maxAttempts: 1 })
    expect(lockedUntil(NOW)).toBeNull()
    await check(bad, NOW)
    expect(lockedUntil(NOW + 10)).toBe(NOW + 300)
    expect(lockedUntil(NOW + 10)).toBe(NOW + 300)
  })

  it('unlocks after the lock time with a fresh set of attempts', async () => {
    const { key, check, lockedUntil, bad } = await setup({ maxAttempts: 2, lockSeconds: 60 })
    await check(bad, NOW)
    await check(bad, NOW)
    expect(lockedUntil(NOW + 59)).toBe(NOW + 60)

    const later = NOW + 60
    expect(lockedUntil(later)).toBeNull()
    const goodLater = await totp(key, later)
    const badLater = goodLater === '000000' ? '111111' : '000000'
    await expect(check(badLater, later)).resolves.toEqual({ status: 'mismatch', attemptsLeft: 1 })
  })

  it('does not burn an attempt on a malformed code', async () => {
    const { check, bad } = await setup({ maxAttempts: 1 })
    await expect(check('12a', NOW)).resolves.toEqual({ status: 'invalid' })
    await expect(check('1234567', NOW)).resolves.toEqual({ status: 'invalid' })
    await expect(check(bad, NOW)).resolves.toEqual({ status: 'locked', unlocksAt: NOW + 300 })
  })

  it('resets the count after a match', async () => {
    const { check, good, bad } = await setup({ maxAttempts: 2 })
    await check(bad, NOW)
    await check(good, NOW)
    await expect(check(bad, NOW)).resolves.toEqual({ status: 'mismatch', attemptsLeft: 1 })
  })
})
