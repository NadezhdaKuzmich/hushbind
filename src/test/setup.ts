import '@testing-library/jest-dom/vitest'
// jsdom has no IndexedDB; this in-memory one behaves like the browser's
import 'fake-indexeddb/auto'
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

// jsdom does no layout: scrolling is a no-op that tests can assert on
const scrollIntoView = vi.fn<Element['scrollIntoView']>()
// scrollTo is overloaded, a mock can't match its type: defineProperty skips the check
const scrollTo = vi.fn<(...args: unknown[]) => void>()
Element.prototype.scrollIntoView = scrollIntoView
Object.defineProperty(window, 'scrollTo', { writable: true, value: scrollTo })

/** The scroll mocks, so tests assert on them without pulling methods off objects. */
export const scrollMocks = { scrollIntoView, scrollTo }

afterEach(() => {
  cleanup()
  reducedMotion = false
  vi.useRealTimers()
  scrollIntoView.mockClear()
  scrollTo.mockClear()
  // The URL lives on the shared window: a hash left by one test would route the next one
  window.history.replaceState(null, '', '/')
})

// Any console.error/warn fails the test: React warnings can't scroll by unnoticed
const consoleMessages: string[] = []

beforeEach(() => {
  consoleMessages.length = 0
  for (const level of ['error', 'warn'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      consoleMessages.push(`console.${level}: ${args.map(String).join(' ')}`)
    })
  }
})

afterEach(() => {
  vi.mocked(console.error).mockRestore()
  vi.mocked(console.warn).mockRestore()
  if (consoleMessages.length > 0) {
    throw new Error(`Unexpected console output:\n${consoleMessages.join('\n')}`)
  }
})
