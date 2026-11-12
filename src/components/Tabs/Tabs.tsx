import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import styles from './Tabs.module.css'

export interface TabItem {
  /** Stable id, unique inside this Tabs. */
  id: string
  label: ReactNode
  content: ReactNode
}

export interface TabsProps {
  tabs: readonly TabItem[]
  /** Accessible name of the tab list, e.g. "Call scenarios". */
  label: string
  /** Tab open on first render. Defaults to the first one. */
  defaultTabId?: string
  /** Called after the user switches tabs. */
  onChange?: (id: string) => void
  /** `warning` styling for the given tab ids (e.g. the scam scenario). */
  warningTabIds?: readonly string[]
}

/**
 * Tabs per the WAI-ARIA APG pattern, automatic activation.
 * - Arrow Left/Right move between tabs, Home/End jump to the ends.
 * - Roving tabindex: only the active tab is in the Tab order, so Tab goes straight into the panel.
 * - Inactive panels stay in the DOM with `hidden` so `aria-controls` always points somewhere.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
export function Tabs({ tabs, label, defaultTabId, onChange, warningTabIds = [] }: TabsProps) {
  const baseId = useId()
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  const select = (id: string) => {
    setActiveId(id)
    onChange?.(id)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1
    const next: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }
    const target = next[event.key]
    if (target === undefined) return
    event.preventDefault()
    const tab = tabs[target]
    if (!tab) return
    select(tab.id)
    tabRefs.current.get(tab.id)?.focus()
  }

  return (
    <div className={styles.tabs}>
      <div role="tablist" aria-label={label} className={styles.list}>
        {tabs.map((tab, index) => {
          const selected = tab.id === activeId
          const warning = warningTabIds.includes(tab.id)
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node)
                else tabRefs.current.delete(tab.id)
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={[styles.tab, warning && styles.warning].filter(Boolean).join(' ')}
              onClick={() => {
                select(tab.id)
              }}
              onKeyDown={(event) => {
                onKeyDown(event, index)
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== activeId}
          tabIndex={0}
          className={styles.panel}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
