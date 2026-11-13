import { act, renderHook, waitFor } from '@testing-library/react'
import { importSecret, totp } from '../lib/totp'
import { useTotpCode } from './useTotpCode'

const SECRET = new TextEncoder().encode('12345678901234567890123456789012')

describe('useTotpCode', () => {
  it('returns null code without a key', () => {
    const { result } = renderHook(() => useTotpCode(null))
    expect(result.current.code).toBeNull()
  })

  it('shows the code for the current window', async () => {
    // Only the clock is fake: crypto resolves on real timers, and waitFor handles act()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(60_000))
    const key = await importSecret(SECRET)
    const expected = await totp(key, 60)

    const { result } = renderHook(() => useTotpCode(key))
    await waitFor(() => {
      expect(result.current.code).toBe(expected)
    })
  })

  it('never shows the previous key’s code after the key changes', async () => {
    const first = await importSecret(SECRET)
    const second = await importSecret(new TextEncoder().encode('another-secret-of-32-bytes-long!'))
    const { result, rerender } = renderHook(({ key }) => useTotpCode(key), {
      initialProps: { key: first },
    })
    await waitFor(() => {
      expect(result.current.code).not.toBeNull()
    })

    rerender({ key: second })
    // Right after the switch: nothing, rather than the first key's code
    expect(result.current.code).toBeNull()
    await waitFor(() => {
      expect(result.current.code).not.toBeNull()
    })
  })

  it('counts down every second', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(60_000))
    const { result } = renderHook(() => useTotpCode(null))
    expect(result.current.secondsLeft).toBe(30)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.secondsLeft).toBe(25)
  })
})
