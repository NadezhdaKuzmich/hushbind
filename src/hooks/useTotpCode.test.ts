import { act, renderHook } from '@testing-library/react'
import { importSecret, totp } from '../lib/totp'
import { useTotpCode } from './useTotpCode'

const SECRET = new TextEncoder().encode('12345678901234567890123456789012')

describe('useTotpCode', () => {
  it('returns null code without a key', () => {
    const { result } = renderHook(() => useTotpCode(null))
    expect(result.current.code).toBeNull()
  })

  it('shows the code for the current window and counts down', async () => {
    vi.useFakeTimers({
      toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
    })
    vi.setSystemTime(new Date(60_000)) // T=60 s, start of a window
    const key = await importSecret(SECRET)
    const expected = await totp(key, 60)

    const { result } = renderHook(() => useTotpCode(key))
    // vi.waitFor knows about fake timers, Testing Library's waitFor does not
    await vi.waitFor(() => {
      expect(result.current.code).toBe(expected)
    })
    expect(result.current.secondsLeft).toBe(30)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.secondsLeft).toBe(25)
  })
})
