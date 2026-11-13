import { Trans, useLingui } from '@lingui/react/macro'
import { ButtonLink } from '../../components/Button'
import { AppPage } from '../../layout'
import { toHref } from '../../router'
import { MissingContact, usePair, VaultBoundary } from '../pairs'
import { CallerCheck } from './CallerCheck'

const contactsHref = toHref({ name: 'contacts' })

function CheckContent({ pairId }: { pairId: string }) {
  const pair = usePair(pairId)
  return pair ? <CallerCheck pair={pair} /> : <MissingContact />
}

/** "Check the caller": someone says they are this contact; their code decides. */
export function CheckPage({ pairId }: { pairId: string }) {
  const { t } = useLingui()
  return (
    <AppPage title={t`Check a caller`}>
      <VaultBoundary>
        <CheckContent pairId={pairId} />
      </VaultBoundary>
      <ButtonLink href={contactsHref} variant="secondary">
        <Trans>Back to contacts</Trans>
      </ButtonLink>
    </AppPage>
  )
}
