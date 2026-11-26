import { Trans, useLingui } from '@lingui/react/macro'
import { useId, useState, useTransition, type Ref, type SubmitEvent } from 'react'
import { Button } from '../../components/Button'
import type { PairingResult } from '../../lib/crypto'
import { MAX_NAME_LENGTH } from '../../lib/store'
import { formatCode } from '../../lib/totp'
import { usePairsStore } from '../pairs'
import styles from './RemotePairing.module.css'

export interface CompareStepProps {
  sas: string
  onMatch: () => void
  onMismatch: () => void
}

/** The person compares check numbers. This, not the app, is what stops a man in the middle. */
export function CompareStep({ sas, onMatch, onMismatch }: CompareStepProps) {
  return (
    <>
      <p className={styles.sas}>
        <span className={styles.sasLabel}>
          <Trans>Your check number</Trans>
        </span>
        <span className={styles.sasValue}>{formatCode(sas)}</span>
      </p>
      <p className={styles.text}>
        <Trans>
          Compare it with the number on their phone — side by side, or on a video call. Not by text
          message: whoever could change the messages could change that too.
        </Trans>
      </p>
      <div className={styles.actions}>
        <Button onClick={onMatch}>
          <Trans>Numbers match</Trans>
        </Button>
        <Button variant="warning" onClick={onMismatch}>
          <Trans>They don’t match</Trans>
        </Button>
      </div>
    </>
  )
}

export interface NameStepProps {
  result: PairingResult
  onSaved: (name: string) => void
  field?: Ref<HTMLInputElement>
}

/** Name the other person and save the pair into the encrypted vault. */
export function NameStep({ result, onSaved, field }: NameStepProps) {
  const { t } = useLingui()
  const store = usePairsStore()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fieldId = useId()
  const errorId = useId()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('name')
    const name = typeof value === 'string' ? value : ''
    startTransition(async () => {
      try {
        const pair = await store.add(name, result)
        startTransition(() => {
          onSaved(pair.name)
        })
      } catch (cause) {
        setError(
          cause instanceof RangeError
            ? t`Use 1 to ${MAX_NAME_LENGTH} characters.`
            : t`Couldn’t save. Try again.`,
        )
      }
    })
  }

  return (
    <form className={styles.box} onSubmit={handleSubmit}>
      <label htmlFor={fieldId} className={styles.label}>
        <Trans>Name for this contact</Trans>
      </label>
      <input
        ref={field}
        id={fieldId}
        name="name"
        className={styles.input}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="off"
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        <Trans>Save contact</Trans>
      </Button>
    </form>
  )
}
