import { Trans, useLingui } from '@lingui/react/macro'
import { ButtonLink } from '../../components/Button'
import { AppPage } from '../../layout'
import { toHref } from '../../router'

/** Home screen of the app: people you are paired with. Store wiring comes next. */
export function ContactsPage() {
  const { t } = useLingui()
  return (
    <AppPage
      title={t`My contacts`}
      lead={<Trans>No one here yet. Pairing with a person arrives in the next update.</Trans>}
    >
      <ButtonLink href={toHref({ name: 'landing', anchor: null })} variant="secondary">
        <Trans>Back to the site</Trans>
      </ButtonLink>
    </AppPage>
  )
}
