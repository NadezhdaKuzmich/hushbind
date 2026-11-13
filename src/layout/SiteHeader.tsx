import { Trans, useLingui } from '@lingui/react/macro'
import type { MouseEvent } from 'react'
import { ButtonLink } from '../components/Button'
import { Icon } from '../components/Icon'
import { APP_NAME } from '../config'
import { MAIN_ID } from '../router'
import styles from './SiteHeader.module.css'

/**
 * Moves focus to `<main>` without touching the URL.
 * A plain `#main` link would change the hash, and with hash routing that is a navigation.
 */
function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  document.getElementById(MAIN_ID)?.focus()
}

/**
 * Top bar: skip link, logo, in-page navigation, main call to action.
 * The skip link is the first focusable element so keyboard users can jump past the nav.
 */
export function SiteHeader() {
  const { t } = useLingui()
  return (
    <header className={styles.header}>
      <a href={`#${MAIN_ID}`} className={styles.skip} onClick={skipToContent}>
        <Trans>Skip to content</Trans>
      </a>
      <div className={styles.inner}>
        <a href="#top" className={styles.logo}>
          <Icon name="shield" size={26} />
          <span>{APP_NAME}</span>
        </a>
        <nav aria-label={t`Main`} className={styles.nav}>
          <a href="#how">
            <Trans>How it works</Trans>
          </a>
          <a href="#why">
            <Trans>Why it works</Trans>
          </a>
          <a href="#privacy">
            <Trans>Privacy</Trans>
          </a>
        </nav>
        <ButtonLink href="#try" variant="secondary" className={styles.cta}>
          <Trans>Try the demo</Trans>
        </ButtonLink>
      </div>
    </header>
  )
}
