import { renderHook } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

function mockWakeLock(request: () => Promise<WakeLockSentinel>) {
  const wakeLock = { request: vi.fn(request) }
  Object.defineProperty(navigator, 'wakeLock', { value: wakeLock, configurable: true })
  return wakeLock
}

/** A lock plus its `release` mock, kept separate so tests don't pull a method off an object. */
function fakeSentinel() {
  const release = vi.fn(() => Promise.resolve())
  return { sentinel: { release } as unknown as WakeLockSentinel, release }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useWakeLock', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock')
    Reflect.deleteProperty(document, 'visibilityState')
  })

  it('does nothing when the browser has no Wake Lock API', () => {
    expect(() =>
      renderHook(() => {
        useWakeLock(true)
      }),
    ).not.toThrow()
  })

  it('holds the lock while active and releases it on unmount', async () => {
    const { sentinel, release } = fakeSentinel()
    const wakeLock = mockWakeLock(() => Promise.resolve(sentinel))
    const { unmount } = renderHook(() => {
      useWakeLock(true)
    })
    await vi.waitFor(() => {
      expect(wakeLock.request).toHaveBeenCalledWith('screen')
    })

    unmount()
    // Released either right away or as soon as a late lock arrives: both paths count
    await vi.waitFor(() => {
      expect(release).toHaveBeenCalled()
    })
  })

  it('gives back a lock that arrives after unmount', async () => {
    const { sentinel, release } = fakeSentinel()
    let grant: (lock: WakeLockSentinel) => void = () => undefined
    mockWakeLock(
      () =>
        new Promise((resolve) => {
          grant = resolve
        }),
    )
    const { unmount } = renderHook(() => {
      useWakeLock(true)
    })
    unmount()
    grant(sentinel)
    await vi.waitFor(() => {
      expect(release).toHaveBeenCalled()
    })
  })

  it('asks again when the tab becomes visible', async () => {
    const wakeLock = mockWakeLock(() => Promise.resolve(fakeSentinel().sentinel))
    renderHook(() => {
      useWakeLock(true)
    })
    await vi.waitFor(() => {
      expect(wakeLock.request).toHaveBeenCalledTimes(1)
    })

    setVisibility('visible')
    await vi.waitFor(() => {
      expect(wakeLock.request).toHaveBeenCalledTimes(2)
    })
  })

  it('stays quiet when the lock is refused', async () => {
    const wakeLock = mockWakeLock(() => Promise.reject(new DOMException('no', 'NotAllowedError')))
    renderHook(() => {
      useWakeLock(true)
    })
    await vi.waitFor(() => {
      expect(wakeLock.request).toHaveBeenCalled()
    })
  })

  it('does not ask while inactive', () => {
    const wakeLock = mockWakeLock(() => Promise.resolve(fakeSentinel().sentinel))
    renderHook(() => {
      useWakeLock(false)
    })
    expect(wakeLock.request).not.toHaveBeenCalled()
  })
})
