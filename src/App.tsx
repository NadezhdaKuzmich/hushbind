import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { lazy, Suspense } from 'react'
import { LandingPage } from './features/landing'
import { NotFoundPage } from './features/not-found'
import { PageLoading, SiteFooter, SiteHeader } from './layout'
import { MAIN_ID, parseRoute, useHash, useNavigationFocus, type Route } from './router'

// App screens load on demand: landing visitors don't download IndexedDB and pairing code
const ContactsPage = lazy(async () => {
  const { ContactsPage } = await import('./features/contacts')
  return { default: ContactsPage }
})
const ProvePage = lazy(async () => {
  const { ProvePage } = await import('./features/prove')
  return { default: ProvePage }
})
const CheckPage = lazy(async () => {
  const { CheckPage } = await import('./features/check')
  return { default: CheckPage }
})

/** Route → screen. A new route without a case here fails lint (switch-exhaustiveness-check). */
function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'landing':
      return <LandingPage />
    case 'contacts':
      return <ContactsPage />
    case 'prove':
      // key: another contact = a fresh screen, no state carried over from the previous one
      return <ProvePage key={route.pairId} pairId={route.pairId} />
    case 'check':
      return <CheckPage key={route.pairId} pairId={route.pairId} />
    case 'notFound':
      return <NotFoundPage />
  }
}

/** App shell: providers, layout and hash routing. */
export function App() {
  const hash = useHash()
  useNavigationFocus(hash)

  return (
    <I18nProvider i18n={i18n}>
      <SiteHeader />
      <main id={MAIN_ID} tabIndex={-1}>
        <Suspense fallback={<PageLoading />}>
          <Screen route={parseRoute(hash)} />
        </Suspense>
      </main>
      <SiteFooter />
    </I18nProvider>
  )
}
