import { render, screen } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from '../../test/axe'
import { Tabs, type TabItem } from './Tabs'

const TABS: TabItem[] = [
  { id: 'real', label: 'Real call', content: <p>Codes match</p> },
  { id: 'scam', label: 'Scam call', content: <p>Codes differ</p> },
  { id: 'tips', label: 'Tips', content: <p>Hang up and call back</p> },
]

describe('Tabs', () => {
  it('shows the first panel and hides the rest', () => {
    render(<Tabs tabs={TABS} label="Scenarios" />)
    expect(screen.getByRole('tab', { name: 'Real call' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Codes match')).toBeVisible()
    expect(screen.getByText('Codes differ')).not.toBeVisible()
  })

  it('switches on click and reports the change', async () => {
    const onChange = vi.fn()
    render(<Tabs tabs={TABS} label="Scenarios" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Scam call' }))
    expect(screen.getByRole('tabpanel', { name: 'Scam call' })).toHaveTextContent('Codes differ')
    expect(onChange).toHaveBeenCalledWith('scam')
  })

  it('supports arrow keys, wrap-around, Home and End', async () => {
    render(<Tabs tabs={TABS} label="Scenarios" />)
    await userEvent.tab()
    expect(screen.getByRole('tab', { name: 'Real call' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Tips' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Real call' })).toHaveFocus()
    await userEvent.keyboard('{End}{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Real call' })).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps only the active tab in the Tab order', async () => {
    render(<Tabs tabs={TABS} label="Scenarios" />)
    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Tabs tabs={TABS} label="Scenarios" defaultTabId="scam" />)
    await expectNoA11yViolations(container)
  })
})
