import { Trans, useLingui } from '@lingui/react/macro'
import { Suspense } from 'react'
import { Button } from '../../components/Button'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { AppPage } from '../../layout'
import { usePairsStore } from '../pairs'
import { ContactList } from './ContactList'
import styles from './Contacts.module.css'
import { DevTools } from './DevTools'

/** Home screen of the app: people you are paired with. */
export function ContactsPage() {
  const { t } = useLingui()
  const store = usePairsStore()
  return (
    <AppPage
      title={t`My contacts`}
      lead={
        <Trans>
          People you’ve paired with. Each pair has its own codes, and the secret never leaves this
          device.
        </Trans>
      }
    >
      {/* Order matters: Suspense inside the boundary, so "Try again" can show loading again */}
      <ErrorBoundary
        fallback={({ reset }) => (
          <div role="alert" className={styles.empty}>
            <p className={styles.question}>
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
            <p role="status" className={styles.meta}>
              <Trans>Opening your contacts…</Trans>
            </p>
          }
        >
          <ContactList />
        </Suspense>
        {import.meta.env.DEV && <DevTools />}
      </ErrorBoundary>
    </AppPage>
  )
}
