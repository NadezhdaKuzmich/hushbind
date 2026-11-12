import { Trans } from '@lingui/react/macro'
import { APP_NAME, REPO_URL } from '../config'
import styles from './SiteFooter.module.css'

/** Footer with project status and the source link (hidden until the repo URL is known). */
export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>
          © {year} {APP_NAME}. <Trans>An open-source pet project, not a commercial product.</Trans>
        </p>
        {REPO_URL && (
          <a href={REPO_URL} rel="noopener noreferrer" target="_blank">
            <Trans>Source code</Trans>
          </a>
        )}
      </div>
    </footer>
  )
}
