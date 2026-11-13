import userEvent from '@testing-library/user-event'
import type { PairingResult } from '../../lib/crypto'
import { openDb, VaultStore } from '../../lib/store'
import { expectNoA11yViolations } from '../../test/axe'
import { act, renderAsync, screen, within } from '../../test/utils'
import { createPairsStore, PairsProvider } from '../pairs'
import { ContactsPage } from './ContactsPage'

const RESULT: PairingResult = { role: 'initiator', pairSecret: new Uint8Array(32), sas: '000000' }

let dbCounter = 0
const openFreshVault = async () => VaultStore.open(await openDb(`contacts-${String(++dbCounter)}`))

/** Renders the page on a fresh database with the given contacts already saved. */
async function renderContacts(names: string[] = [], openVault = openFreshVault) {
  const store = createPairsStore(openVault)
  for (const name of names) await store.add(name, RESULT)
  const result = await renderAsync(
    <PairsProvider store={store}>
      <ContactsPage />
    </PairsProvider>,
  )
  return { store, ...result }
}

describe('ContactsPage', () => {
  it('shows the empty state when there are no contacts', async () => {
    await renderContacts()
    expect(await screen.findByText(/No contacts yet/)).toBeVisible()
    expect(document.title).toBe('My contacts · Hushbind')
  })

  it('lists contacts with the pairing date', async () => {
    await renderContacts(['Mom', 'Dad'])
    const list = await screen.findByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((item) => within(item).getByText(/^(Mom|Dad)$/).textContent)).toEqual([
      'Mom',
      'Dad',
    ])
    expect(within(items[0] ?? list).getByText(/Paired on/)).toBeInTheDocument()
  })

  it('renames a contact and returns focus to its Rename button', async () => {
    await renderContacts(['Mom'])
    await userEvent.click(await screen.findByRole('button', { name: 'Rename Mom' }))

    const input = screen.getByRole('textbox', { name: 'New name for Mom' })
    expect(input).toHaveFocus()
    await userEvent.keyboard('Mama{Enter}')

    const renamed = await screen.findByRole('button', { name: 'Rename Mama' })
    expect(renamed).toHaveFocus()
    expect(screen.getByText('Mama')).toBeInTheDocument()
  })

  it('shows an error for a blank name and keeps the form open', async () => {
    await renderContacts(['Mom'])
    await userEvent.click(await screen.findByRole('button', { name: 'Rename Mom' }))
    await userEvent.keyboard('   {Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Use 1 to 40 characters.')
    const input = screen.getByRole('textbox', { name: 'New name for Mom' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Use 1 to 40 characters.')
  })

  it('cancels renaming with Escape', async () => {
    await renderContacts(['Mom'])
    await userEvent.click(await screen.findByRole('button', { name: 'Rename Mom' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rename Mom' })).toHaveFocus()
  })

  it('asks before removing, starting on Cancel', async () => {
    await renderContacts(['Mom'])
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Mom' }))

    const question = screen.getByRole('group', { name: /Remove Mom\?/ })
    expect(within(question).getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Remove Mom' })).toHaveFocus()
    expect(screen.getByText('Mom')).toBeInTheDocument()
  })

  it('removes a contact, announces it and keeps focus on the list', async () => {
    await renderContacts(['Mom'])
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Mom' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))

    // Wait for the text, not the element: the live region is always there, empty at first
    expect(await screen.findByText('Mom removed.')).toHaveAttribute('role', 'status')
    expect(screen.getByRole('region', { name: 'Contacts' })).toHaveFocus()
    expect(screen.getByText(/No contacts yet/)).toBeInTheDocument()
  })

  it('shows an error with retry when the vault cannot open', async () => {
    // React reports the caught error to console.error; expected here
    vi.mocked(console.error).mockImplementation(() => undefined)
    const openVault = vi
      .fn<() => Promise<VaultStore>>()
      .mockRejectedValueOnce(new Error('blocked'))
      .mockImplementation(openFreshVault)
    await renderContacts([], openVault)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Couldn’t open your contacts/)
    // React re-rendered after the error, but no second attempt was made on its own
    expect(openVault).toHaveBeenCalledOnce()
    // Retry suspends again: click inside an awaited act, not user-event's sync one
    await act(async () => {
      within(alert).getByRole('button', { name: 'Try again' }).click()
      await Promise.resolve()
    })
    expect(await screen.findByText(/No contacts yet/)).toBeVisible()
  })

  it('links to pairing', async () => {
    await renderContacts()
    // Wait for the list too: a load still running would finish inside the next test
    await screen.findByText(/No contacts yet/)
    expect(screen.getByRole('link', { name: 'Try pairing' })).toHaveAttribute('href', '#/app/pair')
  })

  it('has no accessibility violations', async () => {
    const { container } = await renderContacts(['Mom'])
    await screen.findByRole('list')
    await expectNoA11yViolations(container)
  })
})
