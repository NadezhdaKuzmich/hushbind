import { Trans, useLingui } from '@lingui/react/macro'
import { ButtonLink } from '../../components/Button'
import { AppPage } from '../../layout'
import { toHref } from '../../router'
import { PairDemo } from './PairDemo'

/** Pairing screen. For now only the on-device demo; pairing two phones by QR comes next. */
export function PairPage() {
  const { t } = useLingui()
  return (
    <AppPage title={t`Try pairing`}>
      <PairDemo />
      <ButtonLink href={toHref({ name: 'contacts' })} variant="secondary">
        <Trans>Back to contacts</Trans>
      </ButtonLink>
    </AppPage>
  )
}
