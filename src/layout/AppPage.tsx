import type { ReactNode } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import styles from './AppPage.module.css'

export interface AppPageProps {
  /** Page `<h1>` and the tab title. Plain text, so it works in both. */
  title: string
  /** One or two sentences under the title. */
  lead?: ReactNode
  children?: ReactNode
}

/**
 * Frame for every app screen: one `<h1>`, tab title, consistent width.
 * The landing page has its own layout; app screens all go through this.
 *
 * @example <AppPage title={t`My contacts`}>…</AppPage>
 */
export function AppPage({ title, lead, children }: AppPageProps) {
  useDocumentTitle(title)
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
      {children}
    </div>
  )
}
