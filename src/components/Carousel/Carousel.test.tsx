import { act, render, screen } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from '../../test/axe'
import { setReducedMotion } from '../../test/setup'
import { Carousel, type Slide } from './Carousel'

const SLIDES: Slide[] = [
  { id: 'a', title: 'Pair', content: <p>Pair once</p> },
  { id: 'b', title: 'Call', content: <p>Get a call</p> },
  { id: 'c', title: 'Check', content: <p>Compare codes</p> },
]

const current = () => screen.getByRole('button', { current: true })

describe('Carousel', () => {
  it('moves with next/previous and wraps around', async () => {
    render(<Carousel slides={SLIDES} label="How it works" autoPlay={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Previous slide' }))
    expect(current()).toHaveAccessibleName('Slide 3: Check')
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(current()).toHaveAccessibleName('Slide 1: Pair')
  })

  it('jumps to a slide from its dot', async () => {
    render(<Carousel slides={SLIDES} label="How it works" autoPlay={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Slide 2: Call' }))
    expect(screen.getByRole('group', { name: '2 of 3: Call' })).not.toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('auto-advances and can be stopped', () => {
    vi.useFakeTimers()
    render(<Carousel slides={SLIDES} label="How it works" interval={1000} />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(current()).toHaveAccessibleName('Slide 2: Call')

    act(() => {
      screen.getByRole('button', { name: 'Stop automatic slide show' }).click()
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(current()).toHaveAccessibleName('Slide 2: Call')
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument()
  })

  it('never rotates with reduced motion', () => {
    setReducedMotion(true)
    vi.useFakeTimers()
    render(<Carousel slides={SLIDES} label="How it works" interval={1000} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(current()).toHaveAccessibleName('Slide 1: Pair')
    expect(screen.queryByRole('button', { name: /automatic slide show/ })).not.toBeInTheDocument()
  })

  it('makes hidden slides inert', () => {
    render(<Carousel slides={SLIDES} label="How it works" autoPlay={false} />)
    const hidden = screen.getByText('Get a call').closest('[aria-roledescription="slide"]')
    expect(hidden).toHaveAttribute('inert')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Carousel slides={SLIDES} label="How it works" autoPlay={false} />)
    await expectNoA11yViolations(container)
  })
})
