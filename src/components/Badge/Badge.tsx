import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export interface BadgeProps {
  /** `accent` for status, `warning` for "in development" and risks. */
  tone?: 'neutral' | 'accent' | 'warning'
  /** Show a pulsing dot before the text (stops with reduced motion). */
  dot?: boolean
  children: ReactNode
}

/**
 * Small inline label. Text only — meaning never depends on color alone.
 *
 * @example <Badge tone="warning" dot>iOS app in development</Badge>
 */
export function Badge({ tone = 'neutral', dot = false, children }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[tone]].join(' ')}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
