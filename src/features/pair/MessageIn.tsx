import { Trans } from '@lingui/react/macro'
import { useId, useRef, useState, useTransition, type SubmitEvent } from 'react'
import { Button } from '../../components/Button'
import { QrScanner } from '../../components/QrScanner'
import styles from './RemotePairing.module.css'

export interface MessageInProps {
  /** What to receive, e.g. "Their reply". */
  label: string
  /** Handles the text. Problems come back through `error`, not by throwing. */
  onSubmit: (text: string) => Promise<void>
  /** Shown under the field, announced as an alert. */
  error?: string | null
}

/** Only our pairing messages stop the scanner; any other QR code is ignored. */
const isPairingMessage = (text: string) => text.startsWith('HB1.')

/** Where the other phone's message comes in: scan its QR code, or paste the text. */
export function MessageIn({ label, onSubmit, error }: MessageInProps) {
  const [isPending, startTransition] = useTransition()
  const [scanning, setScanning] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const scanButton = useRef<HTMLButtonElement>(null)
  const fieldId = useId()
  const errorId = useId()

  function submit(text: string) {
    startTransition(async () => {
      await onSubmit(text)
    })
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = new FormData(event.currentTarget).get('message')
    submit(typeof text === 'string' ? text : '')
  }

  function handleScan(text: string) {
    setScanning(false)
    // Show what was read, so a wrong code can be seen and fixed by hand
    if (field.current) field.current.value = text
    submit(text)
  }

  return (
    <form className={styles.box} onSubmit={handleSubmit}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      {scanning ? (
        <QrScanner
          accept={isPairingMessage}
          onResult={handleScan}
          onCancel={() => {
            setScanning(false)
            // The scanner (and its button) is gone: return focus to where it came from
            requestAnimationFrame(() => scanButton.current?.focus())
          }}
        />
      ) : (
        <Button
          ref={scanButton}
          variant="secondary"
          onClick={() => {
            setScanning(true)
          }}
        >
          <Trans>Scan QR code</Trans>
        </Button>
      )}
      <textarea
        ref={field}
        id={fieldId}
        name="message"
        className={styles.message}
        rows={3}
        required
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        placeholder="HB1.…"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        <Trans>Continue</Trans>
      </Button>
    </form>
  )
}
