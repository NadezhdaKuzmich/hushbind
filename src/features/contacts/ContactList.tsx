import { Trans, useLingui } from '@lingui/react/macro'
import { useRef, useState } from 'react'
import { usePairs } from '../pairs'
import { ContactItem } from './ContactItem'
import styles from './Contacts.module.css'

/** Contacts from the vault. Suspends while the vault opens. */
export function ContactList() {
  const { t } = useLingui()
  const pairs = usePairs()
  const [notice, setNotice] = useState('')
  const region = useRef<HTMLElement>(null)

  function handleRemoved(name: string) {
    setNotice(t`${name} removed.`)
    // The removed row had focus; without this it would drop to <body>
    region.current?.focus()
  }

  return (
    <section ref={region} aria-label={t`Contacts`} tabIndex={-1} className={styles.region}>
      {/* Always in the DOM: screen readers only announce changes to an existing live region */}
      <p role="status" className={styles.notice}>
        {notice}
      </p>
      {pairs.length === 0 ? (
        <p className={styles.empty}>
          <Trans>
            No contacts yet. You add a person by pairing with them in person — that screen is coming
            soon.
          </Trans>
        </p>
      ) : (
        <ul className={styles.list}>
          {pairs.map((pair) => (
            <ContactItem key={pair.id} pair={pair} onRemoved={handleRemoved} />
          ))}
        </ul>
      )}
    </section>
  )
}
