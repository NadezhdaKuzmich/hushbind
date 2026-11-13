import { deriveDirectionalKeys, type PairingResult } from '../../lib/crypto'
import { openDb, VaultStore } from '../../lib/store'
import { formatCode, PERIOD_SECONDS, totp } from '../../lib/totp'
import { expectNoA11yViolations } from '../../test/axe'
import { renderAsync, screen, waitFor } from '../../test/utils'
import { createPairsStore, PairsProvider } from '../pairs'
import { ProvePage } from './ProvePage'

const SECRET = new Uint8Array(32).fill(7)
const SON: PairingResult = { role: 'initiator', pairSecret: SECRET, sas: '000000' }

let dbCounter = 0
const openFreshVault = async () => VaultStore.open(await openDb(`prove-${String(++dbCounter)}`))

/** Saves Mom on the son's phone and opens his code screen for her. */
async function renderProve(pairId?: string) {
  const store = createPairsStore(openFreshVault)
  const mom = await store.add('Mom', SON)
  const result = await renderAsync(
    <PairsProvider store={store}>
      <ProvePage pairId={pairId ?? mom.id} />
    </PairsProvider>,
  )
  return { mom, ...result }
}

/** Codes for this window and the next: the test may cross a 30 s boundary. */
async function expectedCodes(key: CryptoKey) {
  const step = Math.floor(Date.now() / 1000 / PERIOD_SECONDS) * PERIOD_SECONDS
  return Promise.all([totp(key, step), totp(key, step + PERIOD_SECONDS)]).then((codes) =>
    codes.map(formatCode),
  )
}

describe('ProvePage', () => {
  it('shows the code that Mom’s phone checks against', async () => {
    await renderProve()
    const display = await screen.findByRole('group', { name: 'Your code for Mom' })
    await waitFor(() => {
      expect(display).toHaveTextContent(/\d{3} \d{3}/)
    })

    // Mom's side: same secret, the other role. Her check key must produce this code
    const { checkKey } = await deriveDirectionalKeys(SECRET, 'responder')
    const shown = screen.getByTestId('code').textContent
    expect(await expectedCodes(checkKey)).toContain(shown)
  })

  it('never shows the code Mom would say', async () => {
    await renderProve()
    await waitFor(() => {
      expect(screen.getByTestId('code')).toHaveTextContent(/\d{3} \d{3}/)
    })
    const { proveKey: momsProveKey } = await deriveDirectionalKeys(SECRET, 'responder')
    expect(await expectedCodes(momsProveKey)).not.toContain(screen.getByTestId('code').textContent)
  })

  it('keeps the name out of the tab title', async () => {
    await renderProve()
    await screen.findByRole('group', { name: 'Your code for Mom' })
    expect(document.title).toBe('Your code · Hushbind')
  })

  it('explains the one safety rule', async () => {
    await renderProve()
    expect(
      await screen.findByRole('region', { name: 'Only on a call you started' }),
    ).toHaveTextContent(/hang up and call Mom back yourself/)
  })

  it('handles a contact that is not on this device', async () => {
    await renderProve('missing-id')
    expect(await screen.findByText(/isn’t on this device/)).toBeVisible()
    expect(screen.queryByTestId('code')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to contacts' })).toHaveAttribute('href', '#/app')
  })

  it('keeps the screen on while the code is shown', async () => {
    const request = vi.fn(() => Promise.resolve({ release: () => Promise.resolve() }))
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
    try {
      await renderProve()
      await screen.findByRole('group', { name: 'Your code for Mom' })
      expect(request).toHaveBeenCalledWith('screen')
    } finally {
      Reflect.deleteProperty(navigator, 'wakeLock')
    }
  })

  it('has no accessibility violations', async () => {
    const { container } = await renderProve()
    await screen.findByRole('group', { name: 'Your code for Mom' })
    await expectNoA11yViolations(container)
  })
})
