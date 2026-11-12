import { Trans } from '@lingui/react/macro'
import { Card } from '../../components/Card'
import { Reveal } from '../../components/Reveal'
import { Section } from '../../components/Section'
import { SectionHeading } from '../../components/SectionHeading'
import styles from './WhyItWorks.module.css'

/** Why a rotating code beats a voice, a fixed password or a security question. */
export function WhyItWorks() {
  return (
    <Section id="why" labelledBy="why-title" tone="raised">
      <SectionHeading
        id="why-title"
        eyebrow={<Trans>Why it works</Trans>}
        title={<Trans>Built on the same idea as bank 2FA</Trans>}
        lead={
          <Trans>
            A cloned voice copies how someone sounds. It can’t copy a secret that lives only on two
            phones.
          </Trans>
        }
      />
      <div className={styles.grid}>
        <Reveal>
          <Card icon="clock" title={<Trans>Overheard? Useless in 30 s</Trans>}>
            <p>
              <Trans>
                Unlike a fixed family password, a leaked code expires before anyone can reuse it.
              </Trans>
            </p>
          </Card>
        </Reveal>
        <Reveal delay={100}>
          <Card icon="layers" title={<Trans>One secret per pair</Trans>}>
            <p>
              <Trans>
                You and Mom share one code, you and your brother another. One lost phone exposes one
                pair, not the whole family.
              </Trans>
            </p>
          </Card>
        </Reveal>
        <Reveal delay={200}>
          <Card icon="lock" title={<Trans>Nothing to look up online</Trans>}>
            <p>
              <Trans>
                Security questions leak through social media. A random secret can’t be guessed from
                your photos.
              </Trans>
            </p>
          </Card>
        </Reveal>
        <Reveal delay={300}>
          <Card icon="warning" tone="warning" title={<Trans>Honest limits</Trans>}>
            <p>
              <Trans>
                It protects only if you ask. If the scammer has your relative’s unlocked phone, no
                code can help.
              </Trans>
            </p>
          </Card>
        </Reveal>
      </div>
    </Section>
  )
}
