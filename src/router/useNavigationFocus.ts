import { useEffect, useRef } from 'react'
import { parseRoute } from './routes'

/** Id of the `<main>` element in App. */
export const MAIN_ID = 'main'

/**
 * What a full page load does for free, redone for in-app navigation:
 * - new screen → scroll to top, move focus to `<main>` (screen readers announce the change);
 * - landing anchor from another screen → scroll to that section;
 * - first load → leave focus alone, never steal it on page open.
 *
 * Depends on the hash string, not on a parsed route object: a primitive compares by value,
 * so the effect runs exactly once per navigation.
 */
export function useNavigationFocus(hash: string): void {
  const previousHash = useRef<string | null>(null)

  useEffect(() => {
    const previous = previousHash.current === null ? null : parseRoute(previousHash.current)
    previousHash.current = hash
    const route = parseRoute(hash)

    if (route.name === 'landing' && route.anchor) {
      // If the landing was already on screen, the browser has scrolled by itself
      if (previous?.name !== 'landing') {
        document.getElementById(route.anchor)?.scrollIntoView()
      }
      return
    }
    if (previous === null) return
    if (previous.name === 'landing' && route.name === 'landing') return

    window.scrollTo(0, 0)
    document.getElementById(MAIN_ID)?.focus({ preventScroll: true })
  }, [hash])
}
