import type { HTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from '../Icon'
import styles from './Card.module.css'

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Card heading. Rendered as `<h3>` — cards live inside an `<h2>` section. */
  title: ReactNode
  /** Optional icon above the title. */
  icon?: IconName
  /** `warning` marks risks and attack scenarios. */
  tone?: 'default' | 'accent' | 'warning'
  children?: ReactNode
}

/**
 * Surface with an icon, a heading and body text.
 * Semantic `<article>` so each card is a self-contained item for screen readers.
 *
 * @example <Card icon="clock" title="Changes every 30 s">A stolen code expires fast.</Card>
 */
export function Card({ title, icon, tone = 'default', className, children, ...rest }: CardProps) {
  return (
    <article className={[styles.card, styles[tone], className].filter(Boolean).join(' ')} {...rest}>
      {icon && (
        <span className={styles.icon}>
          <Icon name={icon} size={22} />
        </span>
      )}
      <h3 className={styles.title}>{title}</h3>
      {children && <div className={styles.body}>{children}</div>}
    </article>
  )
}
