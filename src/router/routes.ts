/**
 * Every screen of the app as a typed value. Add a screen = add a member here;
 * TypeScript then points at every `switch` that has to handle it.
 */
export type Route =
  /** Marketing page. `anchor` is an in-page section like `how`, or null. */
  | { name: 'landing'; anchor: string | null }
  | { name: 'contacts' }
  | { name: 'notFound'; path: string }

/** App routes start with `#/`. Anything else (`#how`, `#main`) is a landing anchor. */
const ROUTE_PREFIX = '#/'

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
    default:
      return { name: 'notFound', path }
  }
}

/** Builds the `href` for a route. Use it instead of hand-written `#/...` strings. */
export function toHref(route: Route): string {
  switch (route.name) {
    case 'landing':
      return route.anchor ? `#${route.anchor}` : '#/'
    case 'contacts':
      return '#/app'
    case 'notFound':
      return `#${route.path}`
  }
}
