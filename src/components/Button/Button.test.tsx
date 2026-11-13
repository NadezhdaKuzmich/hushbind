import { createRef } from 'react'
import { render, screen } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from '../../test/axe'
import { Button, ButtonLink } from './Button'

describe('Button', () => {
  it('is a non-submitting button by default', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('passes ref to the real button', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Save</Button>)
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Save' }))
  })

  it('does not fire when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Button variant="secondary">Save</Button>)
    await expectNoA11yViolations(container)
  })
})

describe('ButtonLink', () => {
  it('renders a real link', () => {
    render(<ButtonLink href="#try">Try the demo</ButtonLink>)
    expect(screen.getByRole('link', { name: 'Try the demo' })).toHaveAttribute('href', '#try')
  })
})
