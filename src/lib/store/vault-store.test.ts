import 'fake-indexeddb/auto'
import { bytesEqual, type PairingResult } from '../crypto'
import { openDb } from './db'
import { pairSecretBytes, VaultStore } from './vault-store'

const RESULT: PairingResult = {
  role: 'initiator',
  pairSecret: new Uint8Array(32).fill(9),
  sas: '123456',
}

let dbCounter = 0
/** Fresh database per test, so tests never share state. */
const freshDb = () => openDb(`test-${String(++dbCounter)}`)

describe('VaultStore', () => {
  it('starts empty', async () => {
    const store = await VaultStore.open(await freshDb())
    await expect(store.listPairs()).resolves.toEqual([])
  })

  it('adds, renames and removes pairs', async () => {
    const store = await VaultStore.open(await freshDb())
    const mom = await store.addPair('  Mom  ', RESULT)
    expect(mom.name).toBe('Mom')
    expect(bytesEqual(pairSecretBytes(mom), RESULT.pairSecret)).toBe(true)

    await store.renamePair(mom.id, 'Mama')
    expect((await store.listPairs()).map((pair) => pair.name)).toEqual(['Mama'])

    await store.removePair(mom.id)
    await expect(store.listPairs()).resolves.toEqual([])
  })

  it('survives a reload with the same key', async () => {
    const db = await freshDb()
    await (await VaultStore.open(db)).addPair('Mom', RESULT)
    const reopened = await VaultStore.open(db)
    expect((await reopened.listPairs()).map((pair) => pair.name)).toEqual(['Mom'])
  })

  it('stores only ciphertext and a non-extractable key', async () => {
    const db = await freshDb()
    await (await VaultStore.open(db)).addPair('Mom', RESULT)
    const sealed = await db.get('vault', 'main')
    expect(JSON.stringify(sealed)).not.toContain('Mom')
    const key = await db.get('keys', 'vault')
    expect(key?.extractable).toBe(false)
  })

  it('rejects empty and overlong names', async () => {
    const store = await VaultStore.open(await freshDb())
    await expect(store.addPair('   ', RESULT)).rejects.toThrow(RangeError)
    await expect(store.addPair('x'.repeat(41), RESULT)).rejects.toThrow(RangeError)
    const mom = await store.addPair('Mom', RESULT)
    await expect(store.renamePair(mom.id, '')).rejects.toThrow(RangeError)
  })
})
