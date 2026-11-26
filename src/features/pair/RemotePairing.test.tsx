import userEvent from '@testing-library/user-event'
import { bytesEqual } from '../../lib/crypto'
import { openDb, pairSecretBytes, VaultStore } from '../../lib/store'
import { expectNoA11yViolations } from '../../test/axe'
import { render, screen, within, type BoundFunctions, type queries } from '../../test/utils'
import { createPairsStore, PairsProvider, type PairsStore } from '../pairs'
import { RemotePairing } from './RemotePairing'

let dbCounter = 0
const openFreshVault = async () => VaultStore.open(await openDb(`remote-${String(++dbCounter)}`))

interface Phone {
  store: PairsStore
  // Explicit type: ReturnType of the overloaded `within` collapses to `any`
  screen: BoundFunctions<typeof queries>
  element: HTMLElement
}

/**
 * Both phones in ONE render: `useId` is unique per React root only, so two roots would
 * repeat ids and labels would point at the other phone's fields.
 */
function renderPhones(...sides: ('initiator' | 'responder')[]): Phone[] {
  const stores = sides.map(() => createPairsStore(openFreshVault))
  render(
    <>
      {sides.map((side, index) => (
        <section key={side} aria-label={`${side} phone`}>
          <PairsProvider store={stores[index] ?? createPairsStore(openFreshVault)}>
            <RemotePairing side={side} />
          </PairsProvider>
        </section>
      ))}
    </>,
  )
  return sides.map((side, index) => {
    const element = screen.getByRole('region', { name: `${side} phone` })
    const store = stores[index]
    if (!store) throw new Error('missing store')
    return { store, element, screen: within(element) }
  })
}

function renderPair() {
  const [son, mom] = renderPhones('initiator', 'responder')
  if (!son || !mom) throw new Error('two phones expected')
  return { son, mom }
}

function renderOne(side: 'initiator' | 'responder') {
  const [phone] = renderPhones(side)
  if (!phone) throw new Error('phone expected')
  return phone
}

/** What a person does: select the message on one phone… */
async function readMessage(phone: Phone, label: string) {
  const field = await phone.screen.findByRole('textbox', { name: label })
  return (field as HTMLTextAreaElement).value
}

/** …and paste it on the other. */
async function pasteMessage(phone: Phone, label: string, text: string) {
  await userEvent.click(phone.screen.getByRole('textbox', { name: label }))
  await userEvent.paste(text)
  await userEvent.click(phone.screen.getByRole('button', { name: 'Continue' }))
}

async function exchangeUntilCompare() {
  const { son, mom } = renderPair()
  await pasteMessage(mom, 'Their invite', await readMessage(son, 'Your invite'))
  await pasteMessage(son, 'Their reply', await readMessage(mom, 'Your reply'))
  await pasteMessage(
    mom,
    'Their last message',
    await readMessage(son, 'Send them this last message'),
  )
  await son.screen.findByRole('heading', { name: 'Compare check numbers' })
  await mom.screen.findByRole('heading', { name: 'Compare check numbers' })
  return { son, mom }
}

const checkNumber = (phone: Phone) => phone.screen.getByText(/^\d{3} \d{3}$/).textContent

async function saveAs(phone: Phone, name: string) {
  await userEvent.click(phone.screen.getByRole('button', { name: 'Numbers match' }))
  await userEvent.type(phone.screen.getByRole('textbox', { name: 'Name for this contact' }), name)
  await userEvent.click(phone.screen.getByRole('button', { name: 'Save contact' }))
  await phone.screen.findByRole('heading', { name: `Paired with ${name}` })
}

describe('RemotePairing', () => {
  it('gives each step an empty field, not the previous step’s text', async () => {
    const { son, mom } = renderPair()
    await pasteMessage(mom, 'Their invite', await readMessage(son, 'Your invite'))
    await mom.screen.findByRole('heading', { name: 'Send your reply' })
    expect(mom.screen.getByRole('textbox', { name: 'Their last message' })).toHaveValue('')
  })

  it('pairs two phones by passing three text messages', async () => {
    const { son, mom } = await exchangeUntilCompare()
    expect(checkNumber(son)).toBe(checkNumber(mom))

    await saveAs(son, 'Mom')
    await saveAs(mom, 'Son')
    const [onSon] = son.store.getSnapshot()
    const [onMom] = mom.store.getSnapshot()
    if (!onSon || !onMom) throw new Error('both phones must save the pair')
    expect([onSon.role, onMom.role]).toEqual(['initiator', 'responder'])
    expect(bytesEqual(pairSecretBytes(onSon), pairSecretBytes(onMom))).toBe(true)
  })

  it('moves focus to each new step', async () => {
    const { son, mom } = renderPair()
    await pasteMessage(mom, 'Their invite', await readMessage(son, 'Your invite'))
    expect(await mom.screen.findByRole('heading', { name: 'Send your reply' })).toHaveFocus()
  })

  it('explains a bad paste and lets you try again', async () => {
    const mom = renderOne('responder')
    await pasteMessage(mom, 'Their invite', 'hello there')
    expect(await mom.screen.findByRole('alert')).toHaveTextContent(/doesn’t look like/)
    expect(mom.screen.getByRole('textbox', { name: 'Their invite' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('stops and saves nothing when the numbers differ', async () => {
    const { son } = await exchangeUntilCompare()
    const firstInvite = son.screen.queryByRole('textbox', { name: 'Your invite' })
    expect(firstInvite).toBeNull()

    await userEvent.click(son.screen.getByRole('button', { name: 'They don’t match' }))
    expect(await son.screen.findByRole('alert')).toHaveTextContent(/someone may be in the middle/)
    expect(son.store.getSnapshot()).toEqual([])

    // Start again makes a brand-new invite
    await userEvent.click(son.screen.getByRole('button', { name: 'Start again' }))
    expect(await readMessage(son, 'Your invite')).toMatch(/^HB1\.c\./)
  })

  it('stops an invite answered after 10 minutes (T10)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-13T10:00:00Z'))
    const { son, mom } = renderPair()
    const invite = await readMessage(son, 'Your invite')
    await pasteMessage(mom, 'Their invite', invite)
    const reply = await readMessage(mom, 'Your reply')

    vi.setSystemTime(new Date('2026-11-13T10:10:01Z'))
    await pasteMessage(son, 'Their reply', reply)
    expect(await son.screen.findByRole('alert')).toHaveTextContent(/more than 10 minutes/)
  })

  it('shows each outgoing message as a QR code too', async () => {
    const son = renderOne('initiator')
    await readMessage(son, 'Your invite')
    expect(son.screen.getByRole('img', { name: 'QR code: Your invite' })).toBeInTheDocument()
  })

  it('joins by scanning the invite’s QR code', async () => {
    const { son, mom } = renderPair()
    const invite = await readMessage(son, 'Your invite')
    // A camera, and a native detector that "sees" the son's QR code
    const stream = { getTracks: () => [{ stop: vi.fn() }] }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(stream) },
    })
    Object.defineProperty(globalThis, 'BarcodeDetector', {
      configurable: true,
      value: Object.assign(
        function BarcodeDetector() {
          return { detect: () => Promise.resolve([{ rawValue: invite }]) }
        },
        { getSupportedFormats: () => Promise.resolve(['qr_code']) },
      ),
    })
    try {
      await userEvent.click(mom.screen.getByRole('button', { name: 'Scan QR code' }))
      expect(await mom.screen.findByRole('heading', { name: 'Send your reply' })).toHaveFocus()
    } finally {
      Reflect.deleteProperty(navigator, 'mediaDevices')
      Reflect.deleteProperty(globalThis, 'BarcodeDetector')
    }
  })

  it('copies a message, and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      const son = renderOne('initiator')
      const invite = await readMessage(son, 'Your invite')
      await userEvent.click(son.screen.getByRole('button', { name: 'Copy' }))
      expect(writeText).toHaveBeenCalledWith(invite)
      expect(await son.screen.findByText('Copied.')).toBeInTheDocument()
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('has no accessibility violations', async () => {
    const son = renderOne('initiator')
    await readMessage(son, 'Your invite')
    await expectNoA11yViolations(son.element)
  })
})
