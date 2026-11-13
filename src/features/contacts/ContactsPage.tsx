import { Trans, useLingui } from '@lingui/react/macro'
import { ButtonLink } from '../../components/Button'
import { AppPage } from '../../layout'
import { toHref } from '../../router'
import { VaultBoundary } from '../pairs'
import { ContactList } from './ContactList'

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
      <ButtonLink href={toHref({ name: 'pair' })}>
        <Trans>Try pairing</Trans>
      </ButtonLink>
      <VaultBoundary>
        <ContactList />
      </VaultBoundary>
    </AppPage>
  )
}
