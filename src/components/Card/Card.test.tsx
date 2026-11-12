import { render, screen } from '../../test/utils'
import { expectNoA11yViolations } from '../../test/axe'
import { Card } from './Card'

describe('Card', () => {
  it('renders an article with a level-3 heading', () => {
    render(
      <Card icon="clock" title="Changes every 30 s">
        <p>A stolen code expires fast.</p>
      </Card>,
    )
    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Changes every 30 s' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <main>
        <h2>Section</h2>
        <Card tone="warning" icon="warning" title="Risk">
          <p>Text</p>
        </Card>
      </main>,
    )
    await expectNoA11yViolations(container)
  })
})
