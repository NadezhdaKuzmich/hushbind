import userEvent from '@testing-library/user-event'
import { deriveDirectionalKeys, type PairingResult } from '../../lib/crypto'
import { openDb, VaultStore } from '../../lib/store'
import { totp } from '../../lib/totp'
import { expectNoA11yViolations } from '../../test/axe'
import { renderAsync, screen } from '../../test/utils'
import { createPairsStore, PairsProvider, type PairsStore } from '../pairs'
import { CheckPage } from './CheckPage'

const SECRET = new Uint8Array(32).fill(7)
// The son's phone; Mom is the responder on the other end
const SON: PairingResult = { role: 'initiator', pairSecret: SECRET, sas: '000000' }

let dbCounter = 0
const openFreshVault = async () => VaultStore.open(await openDb(`check-${String(++dbCounter)}`))

async function codeFrom(role: 'initiator' | 'responder') {
  const { proveKey } = await deriveDirectionalKeys(SECRET, role)
  return totp(proveKey, Date.now() / 1000)
}

/** A code that is surely wrong: Mom's real one with the last digit changed. */
async function wrongCode() {
  const right = await codeFrom('responder')
  return right.slice(0, 5) + String((Number(right[5]) + 1) % 10)
}

async function renderCheck(options: { store?: PairsStore; pairId?: string } = {}) {
  const store = options.store ?? createPairsStore(openFreshVault)
  const mom = (await store.add('Mom', SON)).id
  return renderPage(store, options.pairId ?? mom)
}

async function renderPage(store: PairsStore, pairId: string) {
  const result = await renderAsync(
    <PairsProvider store={store}>
      <CheckPage pairId={pairId} />
    </PairsProvider>,
  )
  await screen.findByText(/Ask Mom to read their code|This is probably not Mom|isn’t on this/)
  return { store, pairId, ...result }
}

async function submit(code: string) {
  const field = screen.getByRole('textbox', { name: 'Code you hear' })
  await userEvent.clear(field)
  await userEvent.type(field, `${code}{Enter}`)
}

describe('CheckPage', () => {
  it('accepts the code Mom reads, with a space as people say it', async () => {
    await renderCheck()
    const code = await codeFrom('responder')
    await submit(`${code.slice(0, 3)} ${code.slice(3)}`)
    const verdict = await screen.findByRole('heading', { name: 'Code matches' })
    expect(verdict).toHaveFocus()
  })

  it('rejects my own code read back to me (reverse attack, T2)', async () => {
    await renderCheck()
    await submit(await codeFrom('initiator'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong code. 2 tries left.')
  })

  it('locks after three wrong codes and says to call back', async () => {
    await renderCheck()
    const wrong = await wrongCode()
    await submit(wrong)
    await screen.findByText(/2 tries left/)
    await submit(wrong)
    await screen.findByText(/1 try left/)
    await submit(wrong)

    const verdict = await screen.findByRole('heading', { name: 'This is probably not Mom' })
    expect(verdict).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent(/Call Mom back on the number you know/)
    expect(screen.getByText('Checking is paused for 5 minutes.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('stays locked after leaving and coming back', async () => {
    const { store, pairId, unmount } = await renderCheck()
    const wrong = await wrongCode()
    for (const left of ['2 tries left', '1 try left']) {
      await submit(wrong)
      await screen.findByText(new RegExp(left))
    }
    await submit(wrong)
    await screen.findByRole('heading', { name: 'This is probably not Mom' })

    unmount()
    await renderPage(store, pairId)
    expect(screen.getByRole('heading', { name: 'This is probably not Mom' })).toBeInTheDocument()
  })

  it('does not burn a try on a typo', async () => {
    await renderCheck()
    await submit('12a')
    expect(await screen.findByRole('alert')).toHaveTextContent('Type the 6 digits you hear.')
    await submit(await wrongCode())
    expect(await screen.findByText(/2 tries left/)).toBeInTheDocument()
  })

  it('never shows a code on this screen', async () => {
    const { container } = await renderCheck()
    expect(screen.queryByTestId('code')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\d{3} ?\d{3}/)
  })

  it('warns that a real contact never refuses (T5)', async () => {
    await renderCheck()
    expect(screen.getByText(/A real Mom never refuses to read the code/)).toBeInTheDocument()
  })

  it('can check again after a match', async () => {
    await renderCheck()
    await submit(await codeFrom('responder'))
    await screen.findByRole('heading', { name: 'Code matches' })
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }))
    expect(screen.getByRole('textbox', { name: 'Code you hear' })).toHaveFocus()
  })

  it('handles a contact that is not on this device', async () => {
    await renderCheck({ pairId: 'missing-id' })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = await renderCheck()
    await submit('12a')
    await screen.findByRole('alert')
    await expectNoA11yViolations(container)
  })
})
