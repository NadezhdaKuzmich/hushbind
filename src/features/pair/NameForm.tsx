import { Trans, useLingui } from '@lingui/react/macro'
import { useId, useState, useTransition, type Ref, type SubmitEvent } from 'react'
import { Button } from '../../components/Button'
import { MAX_NAME_LENGTH } from '../../lib/store'
import styles from './PairDemo.module.css'

export interface NameFormProps {
  /** Saves both contacts. Throws RangeError for a bad name. */
  onSave: (nameOnA: string, nameOnB: string) => Promise<void>
  /** First field, focused when the form appears. */
  firstField?: Ref<HTMLInputElement>
}

/** Each phone names the other one. In the demo both names are typed here. */
export function NameForm({ onSave, firstField }: NameFormProps) {
  const { t } = useLingui()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const onAId = useId()
  const onBId = useId()
  const errorId = useId()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const read = (field: string) => {
      const value = data.get(field)
      return typeof value === 'string' ? value : ''
    }
    startTransition(async () => {
      try {
        await onSave(read('onA'), read('onB'))
      } catch (cause) {
        setError(
          cause instanceof RangeError
            ? t`Use 1 to ${MAX_NAME_LENGTH} characters for each name.`
            : t`Couldn’t save. Try again.`,
        )
      }
    })
  }

  const describedBy = error ? errorId : undefined
  return (
    <form className={styles.names} onSubmit={handleSubmit}>
      <label htmlFor={onAId} className={styles.label}>
        <Trans>On phone A, phone B is called</Trans>
      </label>
      <input
        ref={firstField}
        id={onAId}
        name="onA"
        className={styles.input}
        defaultValue={t`Demo phone B`}
        maxLength={MAX_NAME_LENGTH}
        required
        aria-describedby={describedBy}
      />
      <label htmlFor={onBId} className={styles.label}>
        <Trans>On phone B, phone A is called</Trans>
      </label>
      <input
        id={onBId}
        name="onB"
        className={styles.input}
        defaultValue={t`Demo phone A`}
        maxLength={MAX_NAME_LENGTH}
        required
        aria-describedby={describedBy}
      />
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        <Trans>Save both contacts</Trans>
      </Button>
    </form>
  )
}
