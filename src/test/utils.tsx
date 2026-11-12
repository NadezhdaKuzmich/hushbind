import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act, render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

function Providers({ children }: { children: ReactNode }) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}

/** `render` with every app-level provider. Import from here, not from Testing Library. */
function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options })
}

/**
 * Same as `render`, but awaited inside `act()`. Use for trees with Suspense
 * (anything that calls `use()`), otherwise React warns that act was not awaited.
 */
async function renderAsync(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): Promise<RenderResult> {
  let result: RenderResult | undefined
  // Async callback matters: a sync one makes act() skip the microtasks where use() resumes
  await act(async () => {
    result = renderWithProviders(ui, options)
    await Promise.resolve()
  })
  if (!result) throw new Error('render did not run')
  return result
}

export * from '@testing-library/react'
export { renderAsync, renderWithProviders as render }
