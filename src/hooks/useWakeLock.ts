import { useEffect } from 'react'

/**
 * Keeps the screen on while `active`, so the code doesn't vanish when the phone dims mid-call.
 * The browser drops the lock whenever the tab is hidden, so we ask again when it's visible.
 * No support or a refusal (battery saver) is fine: the screen simply dims as usual.
 *
 * @see https://developer.mozilla.org/docs/Web/API/Screen_Wake_Lock_API
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    async function request() {
      try {
        const next = await navigator.wakeLock.request('screen')
        // Unmounted while waiting: give the lock straight back
        if (cancelled) {
          await next.release()
          return
        }
        lock = next
      } catch {
        // Refused or tab hidden: not an error for us
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void lock?.release()
    }
  }, [active])
}
