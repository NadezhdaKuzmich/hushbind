import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from './test/axe'
import { render, screen } from './test/utils'
import { App } from './App'

describe('App', () => {
  it('renders the landmarks: banner, navigation, main, contentinfo', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('starts the Tab order with a skip link to the main content', async () => {
    render(<App />)
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it('hides the source link while the repo URL is not configured', () => {
    render(<App />)
    expect(screen.queryByRole('link', { name: 'Source code' })).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<App />)
    await screen.findAllByRole('group', { name: 'Code on your screen' })
    await expectNoA11yViolations(container)
  })
})
