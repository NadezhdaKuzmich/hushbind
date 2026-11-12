import userEvent from '@testing-library/user-event'
import { formatCode, importSecret, totp } from '../../lib/totp'
import { expectNoA11yViolations } from '../../test/axe'
import { renderAsync, screen, waitFor, within } from '../../test/utils'
import { getDemoKey } from './demoKeys'
import { LandingPage } from './LandingPage'

const DIGITS = /\d{3} \d{3}/

/** Renders and waits until every live code shows digits, so no update lands after the test. */
async function renderLanding() {
  const result = await renderAsync(
    <main>
      <LandingPage />
    </main>,
  )
  await waitFor(
    () => {
      for (const code of screen.getAllByTestId('code')) expect(code).toHaveTextContent(DIGITS)
    },
    { timeout: 3000 },
  )
  return result
}

describe('LandingPage', () => {
  // Warm the key cache so Suspense resolves inside act() even on a cold first test
  beforeAll(() => Promise.all([getDemoKey('family'), getDemoKey('stranger')]))

  it('has one h1 and every section is a named region', async () => {
    await renderLanding()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    for (const name of [
      /same voice/i,
      /four steps/i,
      /bank 2fa/i,
      /never have/i,
      /before the call/i,
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
  })

  it('shows matching live codes for a real call', async () => {
    await renderLanding()
    const panel = screen.getByRole('tabpanel', { name: 'Real call' })
    const caller = within(panel).getByRole('group', { name: 'Code the caller says' })
    const mine = within(panel).getByRole('group', { name: 'Code on your screen' })
    expect(within(caller).getByTestId('code').textContent).toBe(
      within(mine).getByTestId('code').textContent,
    )
    expect(within(panel).getByText(/codes match/i)).toBeInTheDocument()
  })

  it('shows a mismatch and the safe action for a scam call', async () => {
    await renderLanding()
    await userEvent.click(screen.getByRole('tab', { name: 'Voice-clone scam' }))
    const panel = screen.getByRole('tabpanel', { name: 'Voice-clone scam' })
    expect(within(panel).getByText(/hang up and call back/i)).toBeInTheDocument()
  })

  it('uses real TOTP for the demo codes', async () => {
    const key = await importSecret(new TextEncoder().encode('hushbind-demo-shared-secret-0'))
    const now = Date.now() / 1000
    // The window may roll over while rendering, so the next code is fine too
    const allowed = [await totp(key, now), await totp(key, now + 30)].map(formatCode)
    await renderLanding()
    const [mine] = screen.getAllByRole('group', { name: 'Code on your screen' })
    if (!mine) throw new Error('No code on screen')
    expect(allowed).toContain(within(mine).getByTestId('code').textContent)
  })

  it('has no accessibility violations', async () => {
    const { container } = await renderLanding()
    await expectNoA11yViolations(container)
  })
})
