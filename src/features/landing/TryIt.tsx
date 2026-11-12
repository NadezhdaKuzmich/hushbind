import { Trans, useLingui } from '@lingui/react/macro'
import { Icon } from '../../components/Icon'
import { Section } from '../../components/Section'
import { SectionHeading } from '../../components/SectionHeading'
import { Tabs } from '../../components/Tabs'
import { LiveCode } from './LiveCode'
import styles from './TryIt.module.css'

interface ScenarioProps {
  scam: boolean
}

/** One call scenario: what the caller says, what your screen shows, and the verdict. */
function Scenario({ scam }: ScenarioProps) {
  const { t } = useLingui()
  return (
    <div className={styles.scenario}>
      <div className={styles.call}>
        <p className={styles.bubble}>
          {scam ? (
            <Trans>
              “Mom, it’s me. I crashed the car, I need money right now. Please don’t tell Dad.”
            </Trans>
          ) : (
            <Trans>“Hi, it’s me. Can you send me the bank details for the rent?”</Trans>
          )}
        </p>
        <p className={styles.you}>
          <Trans>“Sure. What’s our code?”</Trans>
        </p>
        <div className={styles.spoken}>
          <span className={styles.who}>
            <Trans>The caller says</Trans>
          </span>
          <LiveCode
            keyName={scam ? 'stranger' : 'family'}
            label={t`Code the caller says`}
            tone={scam ? 'warning' : 'accent'}
          />
        </div>
      </div>

      <div className={styles.check}>
        <span className={styles.who}>
          <Trans>Your screen</Trans>
        </span>
        <LiveCode keyName="family" label={t`Code on your screen`} size="lg" />
        <p className={[styles.verdict, scam ? styles.bad : styles.good].join(' ')}>
          <Icon name={scam ? 'warning' : 'check'} size={22} />
          {scam ? (
            <Trans>Codes differ. Hang up and call back on the number you know.</Trans>
          ) : (
            <Trans>Codes match. It’s really them.</Trans>
          )}
        </p>
      </div>
    </div>
  )
}

/**
 * Interactive demo: switch between a real call and a voice-clone scam.
 * Codes are real TOTP computed in the browser from public demo secrets.
 */
export function TryIt() {
  const { t } = useLingui()
  return (
    <Section id="try" labelledBy="try-title" tone="raised">
      <SectionHeading
        id="try-title"
        eyebrow={<Trans>Try it</Trans>}
        title={<Trans>Same voice. Different code.</Trans>}
        lead={
          <Trans>
            These codes are computed live in your browser, exactly like the app will. Switch the
            scenario and watch them change every 30 seconds.
          </Trans>
        }
      />
      <Tabs
        label={t`Call scenarios`}
        warningTabIds={['scam']}
        tabs={[
          { id: 'real', label: t`Real call`, content: <Scenario scam={false} /> },
          { id: 'scam', label: t`Voice-clone scam`, content: <Scenario scam /> },
        ]}
      />
    </Section>
  )
}
