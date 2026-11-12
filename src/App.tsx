import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { LandingPage } from './features/landing'
import { SiteFooter, SiteHeader } from './layout'

/** App shell: providers + layout. Pages plug into `<main>`; a router comes with stage 2. */
export function App() {
  return (
    <I18nProvider i18n={i18n}>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <LandingPage />
      </main>
      <SiteFooter />
    </I18nProvider>
  )
}
