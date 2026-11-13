import { Trans, useLingui } from '@lingui/react/macro'
import { useLayoutEffect, useRef, useState } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import type { Pair } from '../../lib/store'
import { toHref } from '../../router'
import styles from './Contacts.module.css'
import { RemoveConfirm } from './RemoveConfirm'
import { RenameForm } from './RenameForm'

type Mode = 'view' | 'rename' | 'remove'

export interface ContactItemProps {
  pair: Pair
  /** After removal this item is gone, so the list decides where focus goes. */
  onRemoved: (name: string) => void
}

/** One contact: name and date, or the inline rename / remove step. */
export function ContactItem({ pair, onRemoved }: ContactItemProps) {
  const { t, i18n } = useLingui()
  const [mode, setMode] = useState<Mode>('view')
  const renameButton = useRef<HTMLButtonElement>(null)
  const removeButton = useRef<HTMLButtonElement>(null)
  // Which button gets focus back when the inline step closes
  const returnFocusTo = useRef<'rename' | 'remove' | null>(null)
  const name = pair.name

  // Layout effect: focus moves in the same commit, never a moment on <body>
  useLayoutEffect(() => {
    if (mode !== 'view' || !returnFocusTo.current) return
    const target = returnFocusTo.current === 'rename' ? renameButton : removeButton
    target.current?.focus()
    returnFocusTo.current = null
  }, [mode])

  function backFrom(step: 'rename' | 'remove') {
    returnFocusTo.current = step
    setMode('view')
  }

  const pairedOn = new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'medium' }).format(
    pair.createdAt,
  )

  return (
    <li className={styles.item}>
      <div className={styles.info}>
        <p className={styles.name}>{name}</p>
        <p className={styles.meta}>
          <Trans>
            Paired on <time dateTime={new Date(pair.createdAt).toISOString()}>{pairedOn}</time>
          </Trans>
        </p>
      </div>

      {mode === 'view' && (
        <div className={styles.actions}>
          <ButtonLink
            href={toHref({ name: 'prove', pairId: pair.id })}
            aria-label={t`My code for ${name}`}
          >
            <Trans>My code</Trans>
          </ButtonLink>
          {/* Visible "Rename" + name for screen readers: many identical buttons are confusing */}
          <Button
            ref={renameButton}
            variant="ghost"
            className={styles.compact}
            aria-label={t`Rename ${name}`}
            onClick={() => {
              setMode('rename')
            }}
          >
            <Trans>Rename</Trans>
          </Button>
          <Button
            ref={removeButton}
            variant="ghost"
            className={styles.compact}
            aria-label={t`Remove ${name}`}
            onClick={() => {
              setMode('remove')
            }}
          >
            <Trans>Remove</Trans>
          </Button>
        </div>
      )}
      {mode === 'rename' && (
        <RenameForm
          pair={pair}
          onDone={() => {
            backFrom('rename')
          }}
        />
      )}
      {mode === 'remove' && (
        <RemoveConfirm
          pair={pair}
          onCancel={() => {
            backFrom('remove')
          }}
          onRemoved={() => {
            onRemoved(name)
          }}
        />
      )}
    </li>
  )
}
