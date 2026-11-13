import { Trans } from '@lingui/react/macro'
import styles from './AppPage.module.css'

/**
 * Suspense fallback while a screen's code downloads.
 * `role="status"` makes screen readers announce it without moving focus.
 */
export function PageLoading() {
  return (
    <div className={styles.page}>
      <p role="status" className={styles.lead}>
        <Trans>Loading…</Trans>
      </p>
    </div>
  )
}
