import userEvent from '@testing-library/user-event'
import { importSecret, totp } from '../../lib/totp'
import { expectNoA11yViolations } from '../../test/axe'
import { render, screen, within } from '../../test/utils'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('has one h1 and every section is a named region', () => {
    render(<LandingPage />)
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
    render(<LandingPage />)
    const panel = screen.getByRole('tabpanel', { name: 'Real call' })
    const caller = await within(panel).findByRole('group', { name: 'Code the caller says' })
    const mine = within(panel).getByRole('group', { name: 'Code on your screen' })
    await vi.waitFor(() => {
      expect(caller).toHaveTextContent(/\d{3} \d{3}/)
      expect(mine).toHaveTextContent(/\d{3} \d{3}/)
    })
    expect(caller.textContent.slice(0, 7)).toBe(mine.textContent.slice(0, 7))
    expect(within(panel).getByText(/codes match/i)).toBeInTheDocument()
  })

  it('shows a mismatch and the safe action for a scam call', async () => {
    render(<LandingPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Voice-clone scam' }))
    const panel = screen.getByRole('tabpanel', { name: 'Voice-clone scam' })
    expect(within(panel).getByText(/hang up and call back/i)).toBeInTheDocument()
  })

  it('uses real TOTP for the demo codes', async () => {
    const key = await importSecret(new TextEncoder().encode('hushbind-demo-shared-secret-0'))
    const expected = await totp(key, Date.now() / 1000)
    render(<LandingPage />)
    const mine = await screen.findAllByRole('group', { name: 'Code on your screen' })
    await vi.waitFor(() => {
      expect(mine[0]).toHaveTextContent(`${expected.slice(0, 3)} ${expected.slice(3)}`)
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <main>
        <LandingPage />
      </main>,
    )
    await screen.findAllByRole('group', { name: 'Code on your screen' })
    await expectNoA11yViolations(container)
  })
})
