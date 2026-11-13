import { parseRoute, toHref, type Route } from './routes'

describe('parseRoute', () => {
  it.each([
    ['', { name: 'landing', anchor: null }],
    ['#', { name: 'landing', anchor: null }],
    ['#/', { name: 'landing', anchor: null }],
    ['#how', { name: 'landing', anchor: 'how' }],
    ['#/app', { name: 'contacts' }],
    ['#/app/', { name: 'contacts' }],
    ['#/nope', { name: 'notFound', path: '/nope' }],
    ['#/app/x/../../', { name: 'notFound', path: '/app/x/../..' }],
  ] satisfies [string, Route][])('%j → %o', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route)
  })
})

describe('toHref', () => {
  it.each<Route>([
    { name: 'landing', anchor: null },
    { name: 'landing', anchor: 'try' },
    { name: 'contacts' },
    { name: 'notFound', path: '/nope' },
  ])('round-trips %o', (route) => {
    expect(parseRoute(toHref(route))).toEqual(route)
  })
})
