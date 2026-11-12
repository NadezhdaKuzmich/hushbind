import { detectLocale } from './locale'

describe('detectLocale', () => {
  it('prefers the saved choice', () => {
    expect(detectLocale('en', ['uk-UA'])).toBe('en')
  })

  it('matches a device language by its base tag', () => {
    expect(detectLocale(null, ['en-GB', 'pl-PL'])).toBe('en')
  })

  it('skips unsupported languages', () => {
    expect(detectLocale('xx', ['pl-PL', 'en-US'])).toBe('en')
  })

  it('falls back to English', () => {
    expect(detectLocale(null, ['pl-PL', 'de-DE'])).toBe('en')
  })
})
