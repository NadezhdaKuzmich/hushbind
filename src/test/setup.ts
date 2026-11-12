import '@testing-library/jest-dom/vitest'
import { i18n } from '@lingui/core'
import { cleanup } from '@testing-library/react'

// Tests read source messages, no catalog needed
i18n.loadAndActivate({ locale: 'en', messages: {} })

// jsdom has no matchMedia
let reducedMotion = false

export function setReducedMotion(value: boolean): void {
  reducedMotion = value
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => {
    // Only the modern API; deprecated addListener/removeListener are left out on purpose
    const mock: Partial<MediaQueryList> = {
      matches: query.includes('reduce') ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }
    return mock as MediaQueryList
  },
})

afterEach(() => {
  cleanup()
  reducedMotion = false
  vi.useRealTimers()
})
