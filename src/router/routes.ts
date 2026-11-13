/**
 * Every screen of the app as a typed value. Add a screen = add a member here;
 * TypeScript then points at every `switch` that has to handle it.
 */
export type Route =
  /** Marketing page. `anchor` is an in-page section like `how`, or null. */
  | { name: 'landing'; anchor: string | null }
  | { name: 'contacts' }
  /** My code for one contact. `pairId` is the random id from the vault. */
  | { name: 'prove'; pairId: string }
  /** Check a caller who claims to be this contact. */
  | { name: 'check'; pairId: string }
  | { name: 'notFound'; path: string }

/** App routes start with `#/`. Anything else (`#how`, `#main`) is a landing anchor. */
const ROUTE_PREFIX = '#/'

/**
 * Pair ids are base64url (see VaultStore). Anything else in that slot is a typo or a forged
 * link, so it fails to parse instead of reaching the store.
 */
const PAIR_ID = /^[A-Za-z0-9_-]{1,64}$/

/** Parses `location.hash`. Never throws: unknown input becomes `notFound`. */
export function parseRoute(hash: string): Route {
  if (!hash.startsWith(ROUTE_PREFIX)) {
    const anchor = hash.slice(1)
    return { name: 'landing', anchor: anchor || null }
  }

  // Ignore a trailing slash: `#/app/` and `#/app` are the same page
  const path = hash.slice(1).replace(/\/+$/, '') || '/'
  switch (path) {
    case '/':
      return { name: 'landing', anchor: null }
    case '/app':
      return { name: 'contacts' }
  }

  // Routes with a parameter: /app/c/<pairId>/prove|check
  const [app, c, pairId, action, ...rest] = path.slice(1).split('/')
  if (app === 'app' && c === 'c' && pairId && PAIR_ID.test(pairId) && rest.length === 0) {
    if (action === 'prove') return { name: 'prove', pairId }
    if (action === 'check') return { name: 'check', pairId }
  }
  return { name: 'notFound', path }
}

/** Builds the `href` for a route. Use it instead of hand-written `#/...` strings. */
export function toHref(route: Route): string {
  switch (route.name) {
    case 'landing':
      return route.anchor ? `#${route.anchor}` : '#/'
    case 'contacts':
      return '#/app'
    case 'prove':
      return `#/app/c/${route.pairId}/prove`
    case 'check':
      return `#/app/c/${route.pairId}/check`
    case 'notFound':
      return `#${route.path}`
  }
}
