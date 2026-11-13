import type { PairingResult } from '../../lib/crypto'
import { openDb, VaultStore } from '../../lib/store'
import { createPairsStore } from './pairsStore'

const RESULT: PairingResult = { role: 'initiator', pairSecret: new Uint8Array(32), sas: '000000' }

let dbCounter = 0
const openFreshVault = async () => VaultStore.open(await openDb(`pairs-${String(++dbCounter)}`))

describe('createPairsStore', () => {
  it('returns the same load promise every time', async () => {
    const store = createPairsStore(openFreshVault)
    expect(store.load()).toBe(store.load())
    await store.load()
    expect(store.getSnapshot()).toEqual([])
  })

  it('notifies subscribers and gives a new snapshot on change', async () => {
    const store = createPairsStore(openFreshVault)
    await store.load()
    const before = store.getSnapshot()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    const mom = await store.add('Mom', RESULT)
    expect(listener).toHaveBeenCalled()
    expect(store.getSnapshot()).not.toBe(before)
    expect(store.getSnapshot().map((pair) => pair.name)).toEqual(['Mom'])

    await store.rename(mom.id, 'Mama')
    expect(store.getSnapshot().map((pair) => pair.name)).toEqual(['Mama'])

    unsubscribe()
    listener.mockClear()
    await store.remove(mom.id)
    expect(listener).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toEqual([])
  })

  it('keeps the snapshot stable between reads', async () => {
    const store = createPairsStore(openFreshVault)
    await store.load()
    expect(store.getSnapshot()).toBe(store.getSnapshot())
  })

  it('keeps a failed load until retry() is called', async () => {
    const openVault = vi
      .fn<() => Promise<VaultStore>>()
      .mockRejectedValueOnce(new Error('blocked'))
      .mockImplementation(openFreshVault)
    const store = createPairsStore(openVault)

    const failed = store.load()
    await expect(failed).rejects.toThrow('blocked')
    // Same rejected promise: re-rendering must not trigger a new attempt
    expect(store.load()).toBe(failed)

    store.retry()
    const retried = store.load()
    expect(retried).not.toBe(failed)
    await expect(retried).resolves.toBeUndefined()
    expect(openVault).toHaveBeenCalledTimes(2)
  })

  it('derives keys once per pair and forgets them on removal', async () => {
    const store = createPairsStore(openFreshVault)
    const mom = await store.add('Mom', RESULT)
    const keys = store.keysFor(mom)
    expect(store.keysFor(mom)).toBe(keys)
    const { proveKey, checkKey } = await keys
    expect(proveKey).not.toBe(checkKey)

    await store.remove(mom.id)
    expect(store.keysFor(mom)).not.toBe(keys)
  })

  it('ignores retry() when nothing failed', async () => {
    const store = createPairsStore(openFreshVault)
    const loaded = store.load()
    store.retry()
    expect(store.load()).toBe(loaded)
    await loaded
  })
})
