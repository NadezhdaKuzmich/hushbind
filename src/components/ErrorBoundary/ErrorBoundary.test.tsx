import userEvent from '@testing-library/user-event'
import { render, screen } from '../../test/utils'
import { ErrorBoundary } from './ErrorBoundary'

let shouldThrow = true

function Flaky() {
  if (shouldThrow) throw new Error('boom')
  return <p>Loaded</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    // React reports caught errors to console.error; expected here, so silenced on purpose
    vi.mocked(console.error).mockImplementation(() => undefined)
  })

  it('shows the fallback with the error and reports it', () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary
        onError={onError}
        fallback={({ error }) => <p role="alert">{(error as Error).message}</p>}
      >
        <Flaky />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('boom')
    expect(onError).toHaveBeenCalledOnce()
  })

  it('renders the children again after reset', async () => {
    render(
      <ErrorBoundary fallback={({ reset }) => <button onClick={reset}>Try again</button>}>
        <Flaky />
      </ErrorBoundary>,
    )
    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
