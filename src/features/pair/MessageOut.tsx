import { Trans } from '@lingui/react/macro'
import { useId, useState } from 'react'
import { Button } from '../../components/Button'
import styles from './RemotePairing.module.css'

export interface MessageOutProps {
  /** What this message is, e.g. "Your invite". */
  label: string
  /** The `HB1.…` text to pass to the other phone. */
  message: string
}

/** A pairing message to hand over: copy it (and, in the next step, show it as a QR code). */
export function MessageOut({ label, message }: MessageOutProps) {
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null)
  const fieldId = useId()

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied('yes')
    } catch {
      // No permission or no secure context: the text is still there to select by hand
      setCopied('failed')
    }
  }

  return (
    <div className={styles.box}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      {/* Read-only textarea: easy to select on a phone, and it wraps the long line */}
      <textarea
        id={fieldId}
        className={styles.message}
        value={message}
        readOnly
        rows={3}
        spellCheck={false}
      />
      <div className={styles.row}>
        <Button
          variant="secondary"
          onClick={() => {
            void copy()
          }}
        >
          <Trans>Copy</Trans>
        </Button>
        <p role="status" className={styles.hint}>
          {copied === 'yes' && <Trans>Copied.</Trans>}
          {copied === 'failed' && <Trans>Couldn’t copy. Select the text and copy it.</Trans>}
        </p>
      </div>
    </div>
  )
}
