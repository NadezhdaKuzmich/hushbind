import { Trans } from '@lingui/react/macro'
import { useId, useTransition, type Ref, type SubmitEvent } from 'react'
import { Button } from '../../components/Button'
import styles from './RemotePairing.module.css'

export interface MessageInProps {
  /** What to paste, e.g. "Their reply". */
  label: string
  /** Handles the pasted text. Problems come back through `error`, not by throwing. */
  onSubmit: (text: string) => Promise<void>
  /** Shown under the field, announced as an alert. */
  error?: string | null
  field?: Ref<HTMLTextAreaElement>
}

/** Where the other phone's message goes in: paste (and, in a later step, scan a QR code). */
export function MessageIn({ label, onSubmit, error, field }: MessageInProps) {
  const [isPending, startTransition] = useTransition()
  const fieldId = useId()
  const errorId = useId()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = new FormData(event.currentTarget).get('message')
    startTransition(async () => {
      await onSubmit(typeof text === 'string' ? text : '')
    })
  }

  return (
    <form className={styles.box} onSubmit={handleSubmit}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
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
