import { fromBase64Url, toBase64Url } from './bytes'
import { generateVaultKey, open, seal } from './vault'

const CONTEXT = 'hushbind/v1/vault'
const DATA = { pairs: [{ id: 'p1', name: 'Mom' }] }

describe('vault', () => {
  it('round-trips JSON', async () => {
    const key = await generateVaultKey()
    const sealed = await seal(key, DATA, CONTEXT)
    await expect(open(key, sealed, CONTEXT)).resolves.toEqual(DATA)
  })

  it('uses a new IV every time', async () => {
    const key = await generateVaultKey()
    const a = await seal(key, DATA, CONTEXT)
    const b = await seal(key, DATA, CONTEXT)
    expect(a.iv).not.toBe(b.iv)
    expect(a.ct).not.toBe(b.ct)
  })

  it('fails with another key', async () => {
    const sealed = await seal(await generateVaultKey(), DATA, CONTEXT)
    await expect(open(await generateVaultKey(), sealed, CONTEXT)).rejects.toThrow()
  })

  it('fails in another context', async () => {
    const key = await generateVaultKey()
    const sealed = await seal(key, DATA, CONTEXT)
    await expect(open(key, sealed, 'hushbind/v1/other')).rejects.toThrow()
  })

  it('detects tampering', async () => {
    const key = await generateVaultKey()
    const sealed = await seal(key, DATA, CONTEXT)
    const bytes = fromBase64Url(sealed.ct)
    bytes[0] = (bytes[0] ?? 0) ^ 1
    await expect(open(key, { ...sealed, ct: toBase64Url(bytes) }, CONTEXT)).rejects.toThrow()
  })

  it('refuses an unknown format version', async () => {
    const key = await generateVaultKey()
    const sealed = await seal(key, DATA, CONTEXT)
    await expect(open(key, { ...sealed, v: 2 }, CONTEXT)).rejects.toThrow(/v2/)
  })

  it('keeps the key unreadable', async () => {
    const key = await generateVaultKey()
    expect(key.extractable).toBe(false)
  })
})
