import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/axe'
import { renderAsync, screen } from './test/utils'
import { App } from './App'
import { getDemoKey } from './features/landing/demoKeys'

/** Renders and waits until the live demo codes have loaded. */
async function renderApp() {
  const result = await renderAsync(<App />)
  await screen.findAllByRole('group', { name: 'Code on your screen' })
  return result
}

describe('App', () => {
  // Warm the key cache so Suspense resolves inside act() even on a cold first test
  beforeAll(() => Promise.all([getDemoKey('family'), getDemoKey('stranger')]))

  it('renders the landmarks: banner, navigation, main, contentinfo', async () => {
    await renderApp()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('starts the Tab order with a skip link to the main content', async () => {
    await renderApp()
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it('has no accessibility violations', async () => {
    const { container } = await renderApp()
    await expectNoA11yViolations(container)
  })
})
