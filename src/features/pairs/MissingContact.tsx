import { Trans } from '@lingui/react/macro'
import styles from './VaultBoundary.module.css'

/** A screen for one contact was opened, but the contact is gone or from another phone. */
export function MissingContact() {
  return (
    <p className={styles.text}>
      <Trans>
        This contact isn’t on this device. It may have been removed, or the link came from another
        phone.
      </Trans>
    </p>
  )
}
