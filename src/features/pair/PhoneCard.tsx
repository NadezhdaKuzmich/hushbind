import { Trans } from '@lingui/react/macro'
import type { ReactNode } from 'react'
import { toBase64Url, type Bytes } from '../../lib/crypto'
import { formatCode } from '../../lib/totp'
import styles from './PairDemo.module.css'

export interface PhoneCardProps {
  /** "Phone A" or "Phone B". */
  title: string
  /** What this phone just did, in plain words. */
  status: ReactNode
  /** Check number to compare, once this phone has one. */
  sas?: string | null
  /** The public message this phone is about to send. */
  message?: { label: string; bytes: Bytes } | null
  /** The send button, on the phone whose turn it is. */
  action?: ReactNode
  /** Dimmed while waiting for the other phone. */
  waiting?: boolean
}

/** One simulated phone in the pairing demo. */
export function PhoneCard({ title, status, sas, message, action, waiting }: PhoneCardProps) {
  return (
    <article className={[styles.phone, waiting && styles.waiting].filter(Boolean).join(' ')}>
      <h2 className={styles.phoneTitle}>{title}</h2>
      <p className={styles.status}>{status}</p>
      {sas && (
        <p className={styles.sas}>
          <span className={styles.sasLabel}>
            <Trans>Check number</Trans>
          </span>
          <span className={styles.sasValue}>{formatCode(sas)}</span>
        </p>
      )}
      {message && (
        <p className={styles.message}>
          <span className={styles.sasLabel}>{message.label}</span>
          {/* Only a prefix: the point is that it's public bytes, not the bytes themselves */}
          <code className={styles.bytes}>{toBase64Url(message.bytes).slice(0, 22)}…</code>
        </p>
      )}
      {action}
    </article>
  )
}
