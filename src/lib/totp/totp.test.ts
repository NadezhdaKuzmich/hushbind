import {
  constantTimeEqual,
  formatCode,
  importSecret,
  secondsRemaining,
  timeStep,
  totp,
  verifyTotp,
} from './totp'

// RFC 6238 Appendix B, SHA-256 seed (32 ASCII bytes)
const RFC_SECRET = new TextEncoder().encode('12345678901234567890123456789012')

const RFC_VECTORS: [seconds: number, code: string][] = [
  [59, '46119246'],
  [1111111109, '68084774'],
  [1111111111, '67062674'],
  [1234567890, '91819424'],
  [2000000000, '90698825'],
  [20000000000, '77737706'],
]

describe('totp', () => {
  it.each(RFC_VECTORS)('matches RFC 6238 vector at T=%i', async (seconds, expected) => {
    const key = await importSecret(RFC_SECRET)
    await expect(totp(key, seconds, { digits: 8 })).resolves.toBe(expected)
  })

  it('makes 6-digit codes by default, keeping leading zeros', async () => {
    const key = await importSecret(RFC_SECRET)
    const code = await totp(key, 59)
    expect(code).toMatch(/^\d{6}$/)
    expect(code).toBe('119246')
  })

  it('keeps the same code inside one window', async () => {
    const key = await importSecret(RFC_SECRET)
    await expect(totp(key, 60)).resolves.toBe(await totp(key, 89))
  })

  it('rejects unsupported lengths', async () => {
    const key = await importSecret(RFC_SECRET)
    await expect(totp(key, 59, { digits: 4 })).rejects.toThrow(RangeError)
  })
})

describe('verifyTotp', () => {
  it('accepts the previous window (drift) and rejects older ones', async () => {
    const key = await importSecret(RFC_SECRET)
    const previous = await totp(key, 1000 - 30)
    const older = await totp(key, 1000 - 90)
    await expect(verifyTotp(key, previous, 1000)).resolves.toBe(true)
    await expect(verifyTotp(key, older, 1000)).resolves.toBe(false)
  })

  it('rejects a wrong code', async () => {
    const key = await importSecret(RFC_SECRET)
    await expect(verifyTotp(key, '000000', 1000)).resolves.toBe(false)
  })
})

describe('helpers', () => {
  it('counts steps and remaining seconds', () => {
    expect(timeStep(59)).toBe(1)
    expect(secondsRemaining(60)).toBe(30)
    expect(secondsRemaining(89)).toBe(1)
  })

  it('compares strings', () => {
    expect(constantTimeEqual('123456', '123456')).toBe(true)
    expect(constantTimeEqual('123456', '123457')).toBe(false)
    expect(constantTimeEqual('123', '123456')).toBe(false)
  })

  it('splits the code for reading aloud', () => {
    expect(formatCode('482913')).toBe('482 913')
  })
})
