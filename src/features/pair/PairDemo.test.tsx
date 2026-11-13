import userEvent from '@testing-library/user-event'
import { bytesEqual } from '../../lib/crypto'
import { openDb, pairSecretBytes, VaultStore } from '../../lib/store'
import { expectNoA11yViolations } from '../../test/axe'
import { render, screen, within } from '../../test/utils'
import { createPairsStore, PairsProvider } from '../pairs'
import { PairPage } from './PairPage'

let dbCounter = 0
const openFreshVault = async () => VaultStore.open(await openDb(`pair-${String(++dbCounter)}`))

function renderPair() {
  const store = createPairsStore(openFreshVault)
  const result = render(
    <PairsProvider store={store}>
      <PairPage />
    </PairsProvider>,
  )
  return { store, ...result }
}

/** Clicks through the four protocol steps; each next button must get focus. */
async function runProtocol(options: { attacker?: boolean } = {}) {
  if (options.attacker) {
    await userEvent.click(screen.getByRole('checkbox', { name: 'Put an attacker in the middle' }))
  }
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  for (const send of ['Send to phone B', 'Send to phone A', 'Send to phone B']) {
    const button = await screen.findByRole('button', { name: send })
    expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
  }
  return screen.findByRole('heading', { name: 'Do the check numbers match?' })
}

/** Both check numbers as shown on the two phone cards. */
function shownNumbers() {
  return screen
    .getAllByRole('article')
    .map((phone) => within(phone).getByText(/^\d{3} \d{3}$/).textContent)
}

describe('PairDemo', () => {
  it('pairs two phones and saves both sides with matching secrets', async () => {
    const { store } = renderPair()
    expect(await runProtocol()).toHaveFocus()
    const [a, b] = shownNumbers()
    expect(a).toBe(b)

    await userEvent.click(screen.getByRole('button', { name: 'They match' }))
    expect(screen.getByRole('textbox', { name: 'On phone A, phone B is called' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Save both contacts' }))

    expect(await screen.findByRole('heading', { name: 'Saved two demo contacts' })).toHaveFocus()
    const saved = store.getSnapshot()
    expect(saved.map((pair) => [pair.name, pair.role])).toEqual([
      ['Demo phone B', 'initiator'],
      ['Demo phone A', 'responder'],
    ])
    const [onA, onB] = saved
    if (!onA || !onB) throw new Error('both contacts must be saved')
    expect(bytesEqual(pairSecretBytes(onA), pairSecretBytes(onB))).toBe(true)
  })

  it('an attacker makes the numbers differ, and nothing is saved', async () => {
    const { store } = renderPair()
    await runProtocol({ attacker: true })
    expect(screen.getByText(/An attacker sits between the phones/)).toBeInTheDocument()
    const [a, b] = shownNumbers()
    expect(a).not.toBe(b)

    // Claiming a match anyway is caught
    await userEvent.click(screen.getByRole('button', { name: 'They match' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/are different/)

    await userEvent.click(screen.getByRole('button', { name: 'They don’t match' }))
    expect(await screen.findByRole('heading', { name: 'Pairing stopped' })).toHaveFocus()
    expect(screen.getByText(/Good catch/)).toBeInTheDocument()
    expect(store.getSnapshot()).toEqual([])
  })

  it('asks for valid names', async () => {
    renderPair()
    await runProtocol()
    await userEvent.click(screen.getByRole('button', { name: 'They match' }))
    const field = screen.getByRole('textbox', { name: 'On phone A, phone B is called' })
    await userEvent.clear(field)
    await userEvent.type(field, '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Save both contacts' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Use 1 to 40 characters')
  })

  it('can start over', async () => {
    renderPair()
    await runProtocol()
    await userEvent.click(screen.getByRole('button', { name: 'They don’t match' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Start again' }))
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('has no accessibility violations mid-protocol', async () => {
    const { container } = renderPair()
    await runProtocol()
    await expectNoA11yViolations(container)
  })
})
