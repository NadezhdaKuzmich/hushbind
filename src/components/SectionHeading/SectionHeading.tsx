import type { ReactNode } from 'react'
import styles from './SectionHeading.module.css'

export interface SectionHeadingProps {
  /** `id` of the `<h2>` — pass it to the section's `aria-labelledby`. */
  id: string
  /** Short uppercase label above the title. */
  eyebrow?: ReactNode
  title: ReactNode
  /** One or two sentences under the title. */
  lead?: ReactNode
  align?: 'start' | 'center'
}

/**
 * Consistent section header: eyebrow, `<h2>`, lead.
 * One `<h1>` per page (the hero), every section starts with `<h2>` — keeps the outline valid.
 *
 * @example
 * <section aria-labelledby="how">
 *   <SectionHeading id="how" eyebrow="How it works" title="Four steps" />
 * </section>
 */
export function SectionHeading({ id, eyebrow, title, lead, align = 'start' }: SectionHeadingProps) {
  return (
    // div, not header: some screen readers treat any <header> as a second page banner
    <div className={[styles.heading, styles[align]].join(' ')}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {lead && <p className={styles.lead}>{lead}</p>}
    </div>
  )
}
