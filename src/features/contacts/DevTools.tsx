import { useTransition } from 'react'
import { Button } from '../../components/Button'
import { randomBytes } from '../../lib/crypto'
import { usePairsStore } from '../pairs'
import styles from './Contacts.module.css'

/**
 * Dev-only helpers until pairing exists. Rendered behind `import.meta.env.DEV`,
 * which is `false` in `vite build`, so the bundler drops this file from production.
 * English only on purpose: no strings for translators to waste time on.
 */
export function DevTools() {
  const store = usePairsStore()
  const [isPending, startTransition] = useTransition()

  function addTestContact() {
    startTransition(async () => {
      const number = store.getSnapshot().length + 1
      // Random secret, paired with nobody: only for trying the screens
      await store.add(`Test ${String(number)}`, {
        role: 'initiator',
        pairSecret: randomBytes(32),
        sas: '000000',
      })
    })
  }

  return (
    <aside aria-label="Developer tools" className={styles.dev}>
      <p className={styles.meta}>Dev build only — not in production.</p>
      <Button variant="secondary" onClick={addTestContact} disabled={isPending}>
        Add test contact
      </Button>
    </aside>
  )
}
