import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import styles from './FramedNotice.module.css'

/**
 * True when the page runs inside a frame. Reading `window.top` can throw in some sandboxes;
 * that counts as framed too.
 */
export function isFramed(win: { readonly top: unknown; readonly self: unknown } = window): boolean {
  try {
    return win.top !== win.self
  } catch {
    return true
  }
}

/**
 * Shown instead of the app inside someone else's page (clickjacking, threat model T17).
 * GitHub Pages can't send `frame-ancestors`, so the check lives in code until we move hosts.
 */
export function FramedNotice() {
  return (
    <I18nProvider i18n={i18n}>
      <main className={styles.notice}>
        <h1 className={styles.title}>
          <Trans>Hushbind can’t open inside another site</Trans>
        </h1>
        <p className={styles.text}>
          <Trans>To keep your codes safe, Hushbind only works in its own tab.</Trans>
        </p>
        <a href={window.location.href} target="_blank" rel="noopener noreferrer">
          <Trans>Open Hushbind in a new tab</Trans>
        </a>
      </main>
    </I18nProvider>
  )
}
