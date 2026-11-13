import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { use, useId } from 'react'
import { ButtonLink } from '../../components/Button'
import { CodeDisplay } from '../../components/CodeDisplay'
import { useTotpCode } from '../../hooks/useTotpCode'
import { useWakeLock } from '../../hooks/useWakeLock'
import { AppPage } from '../../layout'
import type { Pair } from '../../lib/store'
import { toHref } from '../../router'
import { MissingContact, usePair, usePairsStore, VaultBoundary } from '../pairs'
import styles from './ProvePage.module.css'

const contactsHref = toHref({ name: 'contacts' })

/** My live code for one contact, plus the one rule that keeps it safe. */
function LiveProveCode({ pair }: { pair: Pair }) {
  const { t } = useLingui()
  const store = usePairsStore()
  const { proveKey } = use(store.keysFor(pair))
  const { code, secondsLeft } = useTotpCode(proveKey)
  useWakeLock(true)
  const ruleId = useId()
  const name = pair.name

  return (
    <>
      <p className={styles.lead}>
        <Trans>Read this code to {name} when they ask. A new one appears every 30 seconds.</Trans>
      </p>
      <CodeDisplay
        code={code}
        secondsLeft={secondsLeft}
        label={t`Your code for ${name}`}
        countdownLabel={
          <Plural value={secondsLeft} one="Changes in # second" other="Changes in # seconds" />
        }
        size="lg"
      />
      <section aria-labelledby={ruleId} className={styles.rule}>
        <h2 id={ruleId} className={styles.ruleTitle}>
          <Trans>Only on a call you started</Trans>
        </h2>
        <p className={styles.ruleText}>
          <Trans>
            If someone calls you and asks for your code, hang up and call {name} back yourself.
            Scammers ask for codes to pass them on.
          </Trans>
        </p>
      </section>
    </>
  )
}

function ProveContent({ pairId }: { pairId: string }) {
  const pair = usePair(pairId)
  return pair ? <LiveProveCode pair={pair} /> : <MissingContact />
}

/**
 * "Prove it's me": the code I read out on a call I made.
 * The title has no name on purpose: tab titles end up in browser history.
 */
export function ProvePage({ pairId }: { pairId: string }) {
  const { t } = useLingui()
  return (
    <AppPage title={t`Your code`}>
      <VaultBoundary>
        <ProveContent pairId={pairId} />
      </VaultBoundary>
      <ButtonLink href={contactsHref} variant="secondary">
        <Trans>Back to contacts</Trans>
      </ButtonLink>
    </AppPage>
  )
}
