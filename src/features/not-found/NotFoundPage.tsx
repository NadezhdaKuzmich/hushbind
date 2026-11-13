import { Trans, useLingui } from '@lingui/react/macro'
import { ButtonLink } from '../../components/Button'
import { AppPage } from '../../layout'
import { toHref } from '../../router'

/** Unknown `#/…` address. Doesn't echo the address back: no user input on screen. */
export function NotFoundPage() {
  const { t } = useLingui()
  return (
    <AppPage
      title={t`Page not found`}
      lead={<Trans>This address doesn’t lead anywhere. The link may be old or mistyped.</Trans>}
    >
      <ButtonLink href={toHref({ name: 'landing', anchor: null })}>
        <Trans>Go to the home page</Trans>
      </ButtonLink>
    </AppPage>
  )
}
