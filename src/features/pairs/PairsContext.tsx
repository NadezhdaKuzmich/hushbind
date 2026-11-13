import { createContext, use, useSyncExternalStore, type ReactNode } from 'react'
import { openDb, VaultStore, type Pair } from '../../lib/store'
import { createPairsStore, type PairsStore } from './pairsStore'

// Created on import, but touches IndexedDB only on the first `load()`
const deviceStore = createPairsStore(async () => VaultStore.open(await openDb()))

const PairsContext = createContext<PairsStore>(deviceStore)

/** Swaps the store, e.g. a fresh test database. The app itself uses the default device store. */
export function PairsProvider({ store, children }: { store: PairsStore; children: ReactNode }) {
  return <PairsContext value={store}>{children}</PairsContext>
}

/** The store itself, for actions: `add`, `rename`, `remove`. */
export function usePairsStore(): PairsStore {
  return use(PairsContext)
}

/**
 * The pairs on this device. Suspends until the vault opens, then re-renders on every change.
 * Needs a `<Suspense>` and an `<ErrorBoundary>` above it.
 */
export function usePairs(): readonly Pair[] {
  const store = usePairsStore()
  // Safe in render: load() returns the same promise each time, so no suspend loop
  use(store.load())
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
