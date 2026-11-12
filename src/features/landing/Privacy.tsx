import { Trans } from '@lingui/react/macro'
import type { ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { Reveal } from '../../components/Reveal'
import { Section } from '../../components/Section'
import { SectionHeading } from '../../components/SectionHeading'
import styles from './Privacy.module.css'

function Point({ children }: { children: ReactNode }) {
  return (
    <li className={styles.point}>
      <span className={styles.check}>
        <Icon name="check" size={18} strokeWidth={2.5} />
      </span>
      <span>{children}</span>
    </li>
  )
}

/** Privacy promises, phrased as checkable facts rather than marketing. */
export function Privacy() {
  return (
    <Section id="privacy" labelledBy="privacy-title">
      <div className={styles.layout}>
        <SectionHeading
          id="privacy-title"
          eyebrow={<Trans>Privacy by design</Trans>}
          title={<Trans>We can’t leak what we never have</Trans>}
          lead={
            <Trans>
              Accounts use passkeys — no email, no phone number, no password. The server stores only
              encrypted data it can’t read.
            </Trans>
          }
        />
        <Reveal>
          <ul className={styles.list}>
            <Point>
              <Trans>Family secrets are created on your phones and never sent to a server.</Trans>
            </Point>
            <Point>
              <Trans>Sign in with Face ID, Touch ID or your device PIN through passkeys.</Trans>
            </Point>
            <Point>
              <Trans>Backups are end-to-end encrypted with a key only you hold.</Trans>
            </Point>
            <Point>
              <Trans>No trackers, no ads, no analytics. The code is open source.</Trans>
            </Point>
          </ul>
        </Reveal>
      </div>
    </Section>
  )
}
