import { bytesEqual, concat, fromBase64Url, randomBytes, toBase64Url } from './bytes'

describe('bytes', () => {
  it('round-trips base64url for every length', () => {
    for (let length = 0; length < 70; length++) {
      const data = randomBytes(length)
      const text = toBase64Url(data)
      expect(text).toMatch(/^[A-Za-z0-9_-]*$/)
      expect(bytesEqual(fromBase64Url(text), data)).toBe(true)
    }
  })

  it('rejects invalid base64url', () => {
    expect(() => fromBase64Url('abc+/=')).toThrow(TypeError)
  })

  it('concatenates and compares', () => {
    const joined = concat(Uint8Array.of(1, 2), Uint8Array.of(3))
    expect(bytesEqual(joined, Uint8Array.of(1, 2, 3))).toBe(true)
    expect(bytesEqual(joined, Uint8Array.of(1, 2, 4))).toBe(false)
    expect(bytesEqual(joined, Uint8Array.of(1, 2))).toBe(false)
  })
})
