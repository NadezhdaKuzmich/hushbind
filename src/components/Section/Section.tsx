import type { ReactNode } from 'react'
import styles from './Section.module.css'

export interface SectionProps {
  /** Anchor for in-page links, e.g. `how` → `#how`. */
  id: string
  /** Id of the heading that names this section (landmark name for screen readers). */
  labelledBy: string
  /** `raised` adds a surface band to separate neighbouring sections. */
  tone?: 'plain' | 'raised'
  children: ReactNode
}

/**
 * Page section with consistent spacing and a centered container.
 * `aria-labelledby` turns the `<section>` into a named region landmark.
 */
export function Section({ id, labelledBy, tone = 'plain', children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={[styles.section, styles[tone]].join(' ')}
    >
      <div className={styles.container}>{children}</div>
    </section>
  )
}
