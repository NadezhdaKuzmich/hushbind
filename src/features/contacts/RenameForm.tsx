import { Trans, useLingui } from '@lingui/react/macro'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type SubmitEvent,
  type KeyboardEvent,
} from 'react'
import { Button } from '../../components/Button'
import { MAX_NAME_LENGTH, type Pair } from '../../lib/store'
import { usePairsStore } from '../pairs'
import styles from './Contacts.module.css'

export interface RenameFormProps {
  pair: Pair
  /** Called after saving or cancelling. */
  onDone: () => void
}

/**
 * Inline rename. Not `<form action>` + `useActionState`: React resets the form after
 * an action, and the typed name would vanish together with the error message.
 */
export function RenameForm({ pair, onDone }: RenameFormProps) {
  const { t } = useLingui()
  const store = usePairsStore()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const input = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const errorId = useId()
  // Named variable, so translators see {oldName}, not {0}
  const oldName = pair.name

  // Focus the field with the old name selected: typing replaces it
  // focus() explicitly: select() focuses in browsers, but the spec doesn't promise it
  useLayoutEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('name')
    startTransition(async () => {
      try {
        await store.rename(pair.id, typeof name === 'string' ? name : '')
        onDone()
      } catch (cause) {
        setError(
          cause instanceof RangeError
            ? t`Use 1 to ${MAX_NAME_LENGTH} characters.`
            : t`Couldn’t save. Try again.`,
        )
        input.current?.focus()
      }
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') onDone()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor={inputId} className={styles.label}>
        <Trans>New name for {oldName}</Trans>
      </label>
      <input
        ref={input}
        id={inputId}
        name="name"
        className={styles.input}
        defaultValue={oldName}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="off"
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={handleKeyDown}
      />
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Trans>Saving…</Trans> : <Trans>Save</Trans>}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          <Trans>Cancel</Trans>
        </Button>
      </div>
    </form>
  )
}
