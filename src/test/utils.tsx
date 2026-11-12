import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

function Providers({ children }: { children: ReactNode }) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}

/** `render` with every app-level provider. Import from here, not from Testing Library. */
function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options })
}

export * from '@testing-library/react'
export { renderWithProviders as render }
