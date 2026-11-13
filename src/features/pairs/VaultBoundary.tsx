import { Trans } from '@lingui/react/macro'
import { Suspense, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { usePairsStore } from './PairsContext'
import styles from './VaultBoundary.module.css'

export interface VaultBoundaryProps {
  /** Shown while the vault opens. Defaults to a short status line. */
  loading?: ReactNode
  children: ReactNode
}

/**
 * Wrap any screen part that calls `usePairs()`: loading state, error state and "Try again".
 * Suspense sits inside the boundary, so a retry shows loading again instead of the error.
 */
export function VaultBoundary({ loading, children }: VaultBoundaryProps) {
  const store = usePairsStore()
  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <div role="alert" className={styles.problem}>
          <p className={styles.text}>
            <Trans>
              Couldn’t open your contacts on this device. Private browsing or blocked site storage
              can cause this.
            </Trans>
          </p>
          <Button
            onClick={() => {
              store.retry()
              reset()
            }}
          >
            <Trans>Try again</Trans>
          </Button>
        </div>
      )}
    >
      <Suspense
        fallback={
          loading ?? (
            <p role="status" className={styles.loading}>
              <Trans>Opening your contacts…</Trans>
            </p>
          )
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
