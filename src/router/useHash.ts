import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
  }
}

const getHash = () => window.location.hash
// Server render has no URL; we don't SSR, but React requires a value for hydration safety
const getServerHash = () => ''

/**
 * Current `location.hash`, re-rendering on change.
 * `useSyncExternalStore` is React's API for reading outside state without tearing.
 */
export function useHash(): string {
  return useSyncExternalStore(subscribe, getHash, getServerHash)
}
