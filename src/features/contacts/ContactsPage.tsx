import { Trans, useLingui } from '@lingui/react/macro'
import { AppPage } from '../../layout'
import { VaultBoundary } from '../pairs'
import { ContactList } from './ContactList'
import { DevTools } from './DevTools'

/** Home screen of the app: people you are paired with. */
export function ContactsPage() {
  const { t } = useLingui()
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
      <VaultBoundary>
        <ContactList />
        {import.meta.env.DEV && <DevTools />}
      </VaultBoundary>
    </AppPage>
  )
}
