import { Trans } from '@lingui/react/macro'
import { Badge } from '../../components/Badge'
import { ButtonLink } from '../../components/Button'
import { Section } from '../../components/Section'
import { REPO_URL } from '../../config'
import styles from './FinalCta.module.css'

/**
 * Closing call to action. States the project status honestly:
 * sign-up is not live yet, so there is no fake "Register" button.
 */
export function FinalCta() {
  return (
    <Section id="start" labelledBy="start-title">
      <div className={styles.panel}>
        <Badge tone="accent" dot>
          <Trans>Registration opens in the next stage</Trans>
        </Badge>
        <h2 id="start-title" className={styles.title}>
          <Trans>Agree on a code before the call comes</Trans>
        </h2>
        <p className={styles.text}>
          <Trans>
            Hushbind is an open-source pet project in active development. The web version comes
            first; an iOS app is being built and tested, not yet in the App Store.
          </Trans>
        </p>
        <div className={styles.actions}>
          <ButtonLink href="#try" size="lg">
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
