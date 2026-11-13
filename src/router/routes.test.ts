import { parseRoute, toHref, type Route } from './routes'

describe('parseRoute', () => {
  it.each([
    ['', { name: 'landing', anchor: null }],
    ['#', { name: 'landing', anchor: null }],
    ['#/', { name: 'landing', anchor: null }],
    ['#how', { name: 'landing', anchor: 'how' }],
    ['#/app', { name: 'contacts' }],
    ['#/app/', { name: 'contacts' }],
    ['#/app/c/aZ09_-/prove', { name: 'prove', pairId: 'aZ09_-' }],
    ['#/app/c/aZ09_-/prove/', { name: 'prove', pairId: 'aZ09_-' }],
    ['#/app/c/a%20b/prove', { name: 'notFound', path: '/app/c/a%20b/prove' }],
    ['#/app/c/abc/prove/extra', { name: 'notFound', path: '/app/c/abc/prove/extra' }],
    ['#/app/c/aZ09_-/check', { name: 'check', pairId: 'aZ09_-' }],
    ['#/app/c/abc/delete', { name: 'notFound', path: '/app/c/abc/delete' }],
    ['#/app/c//prove', { name: 'notFound', path: '/app/c//prove' }],
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
    { name: 'prove', pairId: 'aZ09_-' },
    { name: 'check', pairId: 'aZ09_-' },
    { name: 'notFound', path: '/nope' },
  ])('round-trips %o', (route) => {
    expect(parseRoute(toHref(route))).toEqual(route)
  })
})
