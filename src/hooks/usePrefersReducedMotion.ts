import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => {
    media.removeEventListener('change', onChange)
  }
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * True when the user asked the system to reduce motion.
 * Components use it to stop autoplay and decorative animation.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
