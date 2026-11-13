import userEvent from '@testing-library/user-event'
import { act, renderAsync, screen } from './test/utils'
import { App } from './App'
import { getDemoKey } from './features/landing/demoKeys'
import { scrollMocks } from './test/setup'

/**
 * Changes the hash and waits for `hashchange` inside act().
 * jsdom fires the event as a separate task, so a bare assignment would update React outside act.
 */
async function navigate(hash: string) {
  await act(async () => {
    const changed = new Promise((resolve) => {
      window.addEventListener('hashchange', resolve, { once: true })
    })
    window.location.hash = hash
    await changed
  })
}

/** Opens the app at a given hash, like typing the URL. */
async function openAt(hash: string) {
  window.history.replaceState(null, '', `/${hash}`)
  await renderAsync(<App />)
}

describe('App routing', () => {
  beforeAll(() => Promise.all([getDemoKey('family'), getDemoKey('stranger')]))

  it('opens the contacts screen by URL without stealing focus', async () => {
    await openAt('#/app')
    expect(await screen.findByRole('heading', { level: 1, name: 'My contacts' })).toBeVisible()
    expect(document.title).toBe('My contacts · Hushbind')
    expect(document.body).toHaveFocus()
  })

  it('moves focus to main and scrolls up when the screen changes', async () => {
    await openAt('')
    await screen.findAllByRole('group', { name: 'Code on your screen' })

    await navigate('#/app')
    expect(await screen.findByRole('heading', { level: 1, name: 'My contacts' })).toBeVisible()
    expect(screen.getByRole('main')).toHaveFocus()
    expect(scrollMocks.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('scrolls to a landing section when coming from another screen', async () => {
    await openAt('#/app')
    await screen.findByRole('heading', { level: 1, name: 'My contacts' })

    await navigate('#how')
    const section = document.getElementById('how')
    expect(section).not.toBeNull()
    expect(scrollMocks.scrollIntoView.mock.contexts).toContain(section)
  })

  it('shows a not-found page without echoing the address', async () => {
    await openAt('#/<b>hello</b>')
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    expect(screen.queryByText(/hello/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '#/')
  })

  it('skip link focuses main and leaves the URL alone', async () => {
    await openAt('#/app')
    await screen.findByRole('heading', { level: 1, name: 'My contacts' })

    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }))
    expect(screen.getByRole('main')).toHaveFocus()
    expect(window.location.hash).toBe('#/app')
  })
})
