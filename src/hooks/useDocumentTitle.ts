import { useEffect } from 'react'
import { APP_NAME } from '../config'

/**
 * Sets the tab title while the component is on screen, restores the old one after.
 * The title is the first thing a screen reader says after navigation.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · ${APP_NAME}`
    return () => {
      document.title = previous
    }
  }, [title])
}
