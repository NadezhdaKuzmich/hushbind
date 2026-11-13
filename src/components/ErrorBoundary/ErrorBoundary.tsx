import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  /** What to show instead of the crashed subtree. `reset` renders the children again. */
  fallback: (props: { error: unknown; reset: () => void }) => ReactNode
  /** Called once per caught error, e.g. for logging. */
  onError?: (error: unknown, info: ErrorInfo) => void
  children: ReactNode
}

type ErrorBoundaryState = { failed: false } | { failed: true; error: unknown }

/**
 * Catches errors thrown while rendering children, including a rejected promise passed to `use()`.
 * Still a class: React has no hook for this yet.
 * Doesn't catch errors in event handlers — those go to try/catch in the handler.
 *
 * @example
 * <ErrorBoundary fallback={({ reset }) => <Button onClick={reset}>Try again</Button>}>
 *   <Suspense fallback={<Spinner />}><Contacts /></Suspense>
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { failed: true, error }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.onError?.(error, info)
  }

  // Arrow property keeps `this` when passed as a callback
  reset = (): void => {
    this.setState({ failed: false })
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return this.props.fallback({ error: this.state.error, reset: this.reset })
    }
    return this.props.children
  }
}
