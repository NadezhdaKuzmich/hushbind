import {
  createVerifier,
  deriveDirectionalKeys,
  type DirectionalKeys,
  type PairingResult,
  type Verifier,
} from '../../lib/crypto'
import { pairSecretBytes, type Pair, type VaultStore } from '../../lib/store'

/**
 * The list of pairs for React: loads once, then pushes every change to subscribers.
 * Screens read it through `usePairs()`, never through VaultStore directly.
 */
export interface PairsStore {
  /**
   * Opens the vault and loads the list. Same promise on every call, even a rejected one,
   * so `use()` can wait on it without looping.
   */
  load: () => Promise<void>
  /** Forgets failures (load and keys), so the next call tries again. For a "Try again" button. */
  retry: () => void
  subscribe: (listener: () => void) => () => void
  /** Current list. The same array until something changes. */
  getSnapshot: () => readonly Pair[]
  add: (name: string, result: PairingResult) => Promise<Pair>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  /**
   * Prove/check keys of a pair, derived once and kept in memory as non-extractable keys.
   * Same promise per pair, so `use()` can wait on it.
   */
  keysFor: (pair: Pair) => Promise<DirectionalKeys>
  /**
   * The caller check for a pair. One per pair for the whole session, so leaving the screen
   * doesn't reset the attempt count or the lock. Synchronous: the key comes from `keysFor`.
   */
  verifierFor: (pairId: string, checkKey: CryptoKey) => Verifier
}

/**
 * Plain functions in a closure, not a class: `store.subscribe` can be passed around
 * without losing `this` (see pitfall 26).
 */
export function createPairsStore(openVault: () => Promise<VaultStore>): PairsStore {
  let vault: VaultStore | null = null
  let pairs: readonly Pair[] = []
  let loading: Promise<void> | null = null
  let failed = false
  const listeners = new Set<() => void>()
  const keys = new Map<string, Promise<DirectionalKeys>>()
  // Not cleared by retry(): a lock must survive "Try again"
  const verifiers = new Map<string, Verifier>()

  async function refresh(store: VaultStore) {
    pairs = await store.listPairs()
    for (const listener of listeners) listener()
  }

  function load(): Promise<void> {
    loading ??= openVault()
      .then(async (store) => {
        await refresh(store)
        vault = store
      })
      .catch((error: unknown) => {
        // Keep the rejected promise: React re-renders after an error, and a fresh
        // promise each time would mean endless retries instead of an error message
        failed = true
        throw error
      })
    return loading
  }

  function retry() {
    // Keys are cheap to derive again; dropping them also drops a failed derivation
    keys.clear()
    if (!failed) return
    failed = false
    loading = null
  }

  function keysFor(pair: Pair): Promise<DirectionalKeys> {
    let derived = keys.get(pair.id)
    if (!derived) {
      derived = deriveDirectionalKeys(pairSecretBytes(pair), pair.role)
      keys.set(pair.id, derived)
    }
    return derived
  }

  function verifierFor(pairId: string, checkKey: CryptoKey): Verifier {
    let verifier = verifiers.get(pairId)
    if (!verifier) {
      verifier = createVerifier(checkKey)
      verifiers.set(pairId, verifier)
    }
    return verifier
  }

  async function change<T>(action: (store: VaultStore) => Promise<T>): Promise<T> {
    await load()
    if (!vault) throw new Error('Vault is not open')
    const result = await action(vault)
    await refresh(vault)
    return result
  }

  return {
    load,
    retry,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => pairs,
    add: (name, result) => change((store) => store.addPair(name, result)),
    rename: (id, name) => change((store) => store.renamePair(id, name)),
    remove: async (id) => {
      await change((store) => store.removePair(id))
      // A removed pair's keys must not outlive it in memory
      keys.delete(id)
      verifiers.delete(id)
    },
    keysFor,
    verifierFor,
  }
}
