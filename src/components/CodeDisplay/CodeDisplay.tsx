import type { ReactNode } from 'react'
import { formatCode, PERIOD_SECONDS } from '../../lib/totp'
import styles from './CodeDisplay.module.css'

export interface CodeDisplayProps {
  /** Six digits, or `null` while loading. */
  code: string | null
  /** Seconds until the code changes. */
  secondsLeft: number
  /** Accessible name, e.g. "Code shared with Mom". */
  label: string
  /** Text for screen readers about the countdown, e.g. "Changes in 12 seconds". */
  countdownLabel: ReactNode
  /** `warning` when the code does not match. */
  tone?: 'accent' | 'warning'
  size?: 'md' | 'lg'
}

const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Shows a code split in two groups plus a ring that empties as the 30 s pass.
 * The code is not a live region: announcing a new number every 30 s would be noise.
 *
 * @example <CodeDisplay code="482913" secondsLeft={12} label="Mom" countdownLabel="12 s left" />
 */
export function CodeDisplay({
  code,
  secondsLeft,
  label,
  countdownLabel,
  tone = 'accent',
  size = 'md',
}: CodeDisplayProps) {
  const progress = secondsLeft / PERIOD_SECONDS
  return (
    <div
      role="group"
      aria-label={label}
      className={[styles.display, styles[tone], styles[size]].join(' ')}
    >
      <span className={styles.code} data-testid="code">
        {code ? formatCode(code) : '––– –––'}
      </span>
      <span className={styles.timer}>
        <svg viewBox="0 0 48 48" className={styles.ring} aria-hidden="true" focusable="false">
          <circle className={styles.track} cx="24" cy="24" r={RADIUS} />
          <circle
            className={styles.progress}
            cx="24"
            cy="24"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <span className={styles.seconds} aria-hidden="true">
          {secondsLeft}
        </span>
        <span className="visually-hidden">{countdownLabel}</span>
      </span>
    </div>
  )
}
