import { Trans, useLingui } from '@lingui/react/macro'
import { Badge } from '../../components/Badge'
import { ButtonLink } from '../../components/Button'
import { Icon } from '../../components/Icon'
import animations from '../../styles/animations.module.css'
import { LiveCode } from './LiveCode'
import styles from './Hero.module.css'

/** First screen: the promise, two calls to action and two phones showing the same live code. */
export function Hero() {
  const { t } = useLingui()
  return (
    <section id="top" aria-labelledby="hero-title" className={styles.hero}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.copy}>
          <div className={animations.fadeUp}>
            <Badge tone="warning" dot>
              <Trans>Pet project · iOS app in development</Trans>
            </Badge>
          </div>
          <h1
            id="hero-title"
            className={[styles.title, animations.fadeUp, animations.delay1].join(' ')}
          >
            <Trans>
              A voice can be cloned. <span className={styles.accent}>A shared secret can’t.</span>
            </Trans>
          </h1>
          <p className={[styles.lead, animations.fadeUp, animations.delay2].join(' ')}>
            <Trans>
              Scammers need only a few seconds of audio to sound exactly like your son or mom.
              Hushbind gives every pair of people who trust each other a secret 6-digit code that
              changes every 30 seconds. Ask for it — and know who is really calling.
            </Trans>
          </p>
          <div className={[styles.actions, animations.fadeUp, animations.delay3].join(' ')}>
            <ButtonLink href="#try" size="lg">
              <Trans>Try the demo</Trans>
            </ButtonLink>
            <ButtonLink href="#how" size="lg" variant="secondary">
              <Trans>How it works</Trans>
            </ButtonLink>
          </div>
        </div>

        <div className={styles.phones}>
          <figure className={[styles.phone, styles.phoneLeft].join(' ')}>
            <figcaption className={styles.phoneLabel}>
              <Trans>Your phone</Trans>
            </figcaption>
            <LiveCode keyName="family" label={t`Your code for Mom`} />
          </figure>
          <span className={styles.link} aria-hidden="true">
            <Icon name="check" size={18} strokeWidth={2.5} />
          </span>
          <figure className={[styles.phone, styles.phoneRight].join(' ')}>
            <figcaption className={styles.phoneLabel}>
              <Trans>Mom’s phone</Trans>
            </figcaption>
            <LiveCode keyName="family" label={t`Mom’s code for you`} />
          </figure>
        </div>
      </div>
    </section>
  )
}
