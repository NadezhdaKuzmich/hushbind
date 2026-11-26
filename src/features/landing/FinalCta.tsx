import { Trans } from '@lingui/react/macro'
import { Badge } from '../../components/Badge'
import { ButtonLink } from '../../components/Button'
import { Section } from '../../components/Section'
import { REPO_URL } from '../../config'
import { toHref } from '../../router'
import styles from './FinalCta.module.css'

/**
 * Closing call to action. States the project status honestly: the app works on this device
 * today; accounts and sync come in the next stage, so there is no fake "Register" button.
 */
export function FinalCta() {
  return (
    <Section id="start" labelledBy="start-title">
      <div className={styles.panel}>
        <Badge tone="accent" dot>
          <Trans>Works on this device today</Trans>
        </Badge>
        <h2 id="start-title" className={styles.title}>
          <Trans>Agree on a code before the call comes</Trans>
        </h2>
        <p className={styles.text}>
          <Trans>
            Hushbind is an open-source pet project in active development. The web app works on this
            device today; accounts and sync come next, then a phone app.
          </Trans>
        </p>
        <div className={styles.actions}>
          <ButtonLink href={toHref({ name: 'contacts' })} size="lg">
            <Trans>Open the app</Trans>
          </ButtonLink>
          <ButtonLink href="#try" size="lg" variant="secondary">
            <Trans>Try the demo again</Trans>
          </ButtonLink>
          {REPO_URL && (
            <ButtonLink
              href={REPO_URL}
              size="lg"
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Trans>Follow on GitHub</Trans>
            </ButtonLink>
          )}
        </div>
      </div>
    </Section>
  )
}
