import { act, render, screen } from '../../test/utils'
import { Reveal } from './Reveal'

describe('Reveal', () => {
  it('shows content right away when IntersectionObserver is missing', () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>,
    )
    expect(screen.getByText('Hello').parentElement).toHaveAttribute('data-visible', 'true')
  })

  it('waits for the element to enter the viewport', () => {
    let trigger: (visible: boolean) => void = () => undefined
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          trigger = (visible) => {
            callback(
              [{ isIntersecting: visible } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            )
          }
        }
        observe = vi.fn()
        disconnect = vi.fn()
      },
    )
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>,
    )
    const wrapper = screen.getByText('Hello').parentElement
    expect(wrapper).toHaveAttribute('data-visible', 'false')
    screen.getByText('Hello') // still in the DOM for screen readers
    act(() => {
      trigger(true)
    })
    expect(wrapper).toHaveAttribute('data-visible', 'true')
    vi.unstubAllGlobals()
  })
})
