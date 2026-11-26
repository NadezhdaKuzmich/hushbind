import { decodeMessage, encodeMessage, sessionTag, WireError, type WireMessage } from './wire'

const COMMITMENT = new Uint8Array(32).fill(1)
const KEY = Uint8Array.from({ length: 65 }, (_, i) => (i === 0 ? 4 : i))
const TAG = sessionTag(COMMITMENT)

function reasonOf(text: string) {
  try {
    decodeMessage(text)
  } catch (error) {
    return error instanceof WireError ? error.reason : 'other'
  }
  return 'parsed'
}

describe('pairing wire format', () => {
  it.each<WireMessage>([
    { kind: 'invite', commitment: COMMITMENT },
    { kind: 'response', tag: TAG, publicKey: KEY },
    { kind: 'reveal', tag: TAG, publicKey: KEY },
  ])('round-trips a $kind', (message) => {
    expect(decodeMessage(encodeMessage(message))).toEqual(message)
  })

  it('looks like HB1.<kind>… and fits a small QR code', () => {
    const reveal = encodeMessage({ kind: 'reveal', tag: TAG, publicKey: KEY })
    expect(reveal).toMatch(/^HB1\.r\.[\w-]{8}\.[\w-]+$/)
    expect(reveal.length).toBeLessThan(110)
  })

  it('survives line breaks and spaces added by messengers', () => {
    const invite = encodeMessage({ kind: 'invite', commitment: COMMITMENT })
    const wrapped = `  ${invite.slice(0, 10)}\n${invite.slice(10, 20)} ${invite.slice(20)}\n`
    expect(decodeMessage(wrapped)).toEqual({ kind: 'invite', commitment: COMMITMENT })
  })

  it.each([
    ['', 'format'],
    ['hello', 'format'],
    ['HB2.c.AAAA', 'version'],
    ['HB1.x.AAAA', 'format'],
    ['HB1.c.AAAA', 'length'],
    ['HB1.c.not*base64', 'format'],
    ['HB1.c.A', 'format'],
    [`HB1.k.short.${'A'.repeat(87)}`, 'format'],
    [`HB1.k.${TAG}`, 'format'],
    [`HB1.c.${'A'.repeat(43)}.extra`, 'format'],
  ])('rejects %j (%s)', (text, reason) => {
    expect(reasonOf(text)).toBe(reason)
  })
})
