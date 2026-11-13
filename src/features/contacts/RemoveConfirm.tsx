import { Trans } from '@lingui/react/macro'
import { useId, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { Button } from '../../components/Button'
import type { Pair } from '../../lib/store'
import { usePairsStore } from '../pairs'
import styles from './Contacts.module.css'

export interface RemoveConfirmProps {
  pair: Pair
  onCancel: () => void
  onRemoved: () => void
}

/** Inline "are you sure". Removing can't be undone: the shared secret is gone for good. */
export function RemoveConfirm({ pair, onCancel, onRemoved }: RemoveConfirmProps) {
  const store = usePairsStore()
  const [failed, setFailed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const cancel = useRef<HTMLButtonElement>(null)
  const questionId = useId()
  const name = pair.name

  // Start on the safe choice: Enter right away cancels instead of deleting
  useLayoutEffect(() => {
    cancel.current?.focus()
  }, [])

  function confirm() {
    startTransition(async () => {
      try {
        await store.remove(pair.id)
        onRemoved()
      } catch {
        setFailed(true)
      }
    })
  }

  return (
    <div role="group" aria-labelledby={questionId} className={styles.form}>
      <p id={questionId} className={styles.question}>
        <Trans>
          Remove {name}? You won’t be able to check each other until you pair again in person.
        </Trans>
      </p>
      {failed && (
        <p role="alert" className={styles.error}>
          <Trans>Couldn’t remove. Try again.</Trans>
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="warning" onClick={confirm} disabled={isPending}>
          <Trans>Remove</Trans>
        </Button>
        <Button ref={cancel} variant="ghost" onClick={onCancel}>
          <Trans>Cancel</Trans>
        </Button>
      </div>
    </div>
  )
}
