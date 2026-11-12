import { Trans, useLingui } from '@lingui/react/macro'
import type { ReactNode } from 'react'
import { Carousel, type Slide } from '../../components/Carousel'
import { Icon, type IconName } from '../../components/Icon'
import { Section } from '../../components/Section'
import { SectionHeading } from '../../components/SectionHeading'
import styles from './HowItWorks.module.css'

interface StepProps {
  step: number
  icon: IconName
  title: ReactNode
  children: ReactNode
}

function Step({ step, icon, title, children }: StepProps) {
  return (
    <div className={styles.step}>
      <span className={styles.number} aria-hidden="true">
        {String(step).padStart(2, '0')}
      </span>
      <span className={styles.icon}>
        <Icon name={icon} size={40} strokeWidth={1.5} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.text}>{children}</p>
    </div>
  )
}

/** Four steps from pairing to a verified call, as an accessible auto-rotating carousel. */
export function HowItWorks() {
  const { t } = useLingui()
  const slides: Slide[] = [
    {
      id: 'pair',
      title: t`Pair once`,
      content: (
        <Step step={1} icon="layers" title={<Trans>Pair once</Trans>}>
          <Trans>
            Scan each other’s QR code in person, or pair remotely and confirm a short check number
            by voice. Your phones agree on a secret that never travels over the internet.
          </Trans>
        </Step>
      ),
    },
    {
      id: 'tick',
      title: t`Codes change every 30 s`,
      content: (
        <Step step={2} icon="clock" title={<Trans>Codes change every 30 seconds</Trans>}>
          <Trans>
            Both phones compute the same 6-digit code from the secret and the current time. No
            network needed, works in airplane mode.
          </Trans>
        </Step>
      ),
    },
    {
      id: 'ask',
      title: t`Ask for the code`,
      content: (
        <Step step={3} icon="pulse" title={<Trans>Something feels off? Ask</Trans>}>
          <Trans>
            Urgent money, secrecy, a new number — classic scam signs. Ask the caller: “What’s our
            code?” A real relative opens the app and reads it.
          </Trans>
        </Step>
      ),
    },
    {
      id: 'compare',
      title: t`Compare and decide`,
      content: (
        <Step step={4} icon="shield" title={<Trans>Compare and decide</Trans>}>
          <Trans>
            Same code — it’s them. Different code or excuses — hang up and call back on the number
            you already know.
          </Trans>
        </Step>
      ),
    },
  ]

  return (
    <Section id="how" labelledBy="how-title">
      <SectionHeading
        id="how-title"
        eyebrow={<Trans>How it works</Trans>}
        title={<Trans>Four steps, one minute to set up</Trans>}
      />
      <Carousel slides={slides} label={t`How Hushbind works`} />
    </Section>
  )
}
