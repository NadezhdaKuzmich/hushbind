import { i18n, type Messages } from '@lingui/core'

/** Locales with a translation catalog. Adding one = one catalog file, no code changes. */
export const SUPPORTED_LOCALES = ['en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

function isSupported(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Picks the first supported locale from the user's preferences (ADR-9).
 * Order: saved choice → device languages → English. No IP lookups.
 */
export function detectLocale(saved: string | null, deviceLanguages: readonly string[]): Locale {
  const candidates = [saved, ...deviceLanguages]
  for (const candidate of candidates) {
    if (!candidate) continue
    const base = candidate.toLowerCase().split('-')[0] ?? ''
    if (isSupported(base)) return base
  }
  return DEFAULT_LOCALE
}

const catalogs: Record<Locale, () => Promise<{ messages: Messages }>> = {
  en: () => import('./locales/en/messages.po'),
}

/** Loads a compiled catalog and makes it active for the whole app. */
export async function activateLocale(locale: Locale): Promise<void> {
  const { messages } = await catalogs[locale]()
  i18n.load(locale, messages)
  i18n.activate(locale)
  document.documentElement.lang = locale
}

export { i18n }
