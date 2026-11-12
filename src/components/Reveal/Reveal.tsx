import type { ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'
import styles from './Reveal.module.css'

export interface RevealProps {
  children: ReactNode
  /** Stagger in ms, for items in a grid. */
  delay?: number
  className?: string
}

/**
 * Fades and lifts its content in when it scrolls into view.
 * Reduced motion: shown immediately (handled in CSS).
 *
 * @example <Reveal delay={120}><Card … /></Reveal>
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      data-visible={inView}
      style={{ transitionDelay: `${String(delay)}ms` }}
    >
      {children}
    </div>
  )
}
