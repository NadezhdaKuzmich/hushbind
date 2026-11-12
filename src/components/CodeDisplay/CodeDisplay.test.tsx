import { render, screen } from '../../test/utils'
import { expectNoA11yViolations } from '../../test/axe'
import { CodeDisplay } from './CodeDisplay'

describe('CodeDisplay', () => {
  it('groups digits for reading aloud', () => {
    render(<CodeDisplay code="482913" secondsLeft={12} label="Mom" countdownLabel="12 s left" />)
    expect(screen.getByRole('group', { name: 'Mom' })).toHaveTextContent('482 913')
    expect(screen.getByText('12 s left')).toBeInTheDocument()
  })

  it('shows a placeholder while loading', () => {
    render(<CodeDisplay code={null} secondsLeft={30} label="Mom" countdownLabel="30 s left" />)
    expect(screen.getByTestId('code')).toHaveTextContent('––– –––')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CodeDisplay code="000123" secondsLeft={3} label="Mom" countdownLabel="3 s" tone="warning" />,
    )
    await expectNoA11yViolations(container)
  })
})
