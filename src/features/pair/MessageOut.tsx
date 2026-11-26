import { Trans, useLingui } from '@lingui/react/macro'
import { useId, useState } from 'react'
import { Button } from '../../components/Button'
import { QrCode } from '../../components/QrCode'
import { useWakeLock } from '../../hooks/useWakeLock'
import styles from './RemotePairing.module.css'

export interface MessageOutProps {
  /** What this message is, e.g. "Your invite". */
  label: string
  /** The `HB1.…` text to pass to the other phone. */
  message: string
}

/**
 * A pairing message to hand over: a QR code to scan side by side, or text to copy and send.
 * The screen stays on while it's shown, so it doesn't dim while the other phone scans.
 */
export function MessageOut({ label, message }: MessageOutProps) {
  const { t } = useLingui()
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null)
  const labelId = useId()
  const hintId = useId()
  useWakeLock(true)

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
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <QrCode value={message} label={t`QR code: ${label}`} />
      <p id={hintId} className={styles.hint}>
        <Trans>Or copy the text and send it:</Trans>
      </p>
      {/* Read-only textarea: easy to select on a phone, and it wraps the long line */}
      {/* Named by the same label as the QR code; the hint describes it */}
      <textarea
        aria-labelledby={labelId}
        aria-describedby={hintId}
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
