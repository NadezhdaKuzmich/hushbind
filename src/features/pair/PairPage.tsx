import { Trans, useLingui } from '@lingui/react/macro'
import { ButtonLink } from '../../components/Button'
import { AppPage } from '../../layout'
import { toHref, type PairMode } from '../../router'
import { PairDemo } from './PairDemo'
import { RemotePairing } from './RemotePairing'
import styles from './RemotePairing.module.css'

/** Three ways in: show an invite, answer one, or watch the demo. */
function PairChooser() {
  return (
    <ul className={styles.choices}>
      <li className={styles.choice}>
        <h2 className={styles.choiceTitle}>
          <Trans>Start</Trans>
        </h2>
        <p className={styles.choiceText}>
          <Trans>You show an invite. Best side by side; a message works too.</Trans>
        </p>
        <ButtonLink href={toHref({ name: 'pair', mode: 'start' })}>
          <Trans>Start pairing</Trans>
        </ButtonLink>
      </li>
      <li className={styles.choice}>
        <h2 className={styles.choiceTitle}>
          <Trans>Join</Trans>
        </h2>
        <p className={styles.choiceText}>
          <Trans>The other person started and has an invite for you.</Trans>
        </p>
        <ButtonLink href={toHref({ name: 'pair', mode: 'join' })} variant="secondary">
          <Trans>Join pairing</Trans>
        </ButtonLink>
      </li>
      <li className={styles.choice}>
        <h2 className={styles.choiceTitle}>
          <Trans>Try it</Trans>
        </h2>
        <p className={styles.choiceText}>
          <Trans>Both phones on this screen, with or without an attacker.</Trans>
        </p>
        <ButtonLink href={toHref({ name: 'pair', mode: 'demo' })} variant="secondary">
          <Trans>Try on this device</Trans>
        </ButtonLink>
      </li>
    </ul>
  )
}

/** Pairing screens. Each mode has its own address, so Back returns to the choice. */
export function PairPage({ mode }: { mode: PairMode }) {
  const { t } = useLingui()
  const titles: Record<PairMode, string> = {
    choose: t`Pair with someone`,
    start: t`Start pairing`,
    join: t`Join pairing`,
    demo: t`Try pairing`,
  }
  const back =
    mode === 'choose'
      ? { href: toHref({ name: 'contacts' }), label: t`Back to contacts` }
      : { href: toHref({ name: 'pair', mode: 'choose' }), label: t`Other ways to pair` }

  return (
    <AppPage title={titles[mode]}>
      {mode === 'choose' && <PairChooser />}
      {mode === 'start' && <RemotePairing key="start" side="initiator" />}
      {mode === 'join' && <RemotePairing key="join" side="responder" />}
      {mode === 'demo' && <PairDemo />}
      <ButtonLink href={back.href} variant="secondary">
        {back.label}
      </ButtonLink>
    </AppPage>
  )
}
