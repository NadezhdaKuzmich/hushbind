/**
 * Build-time settings. Only `VITE_`-prefixed variables reach the browser bundle —
 * never put secrets in them, everything here is public.
 * @see https://vite.dev/guide/env-and-mode
 */

/** Source repository. CI sets it from the GitHub repository URL; empty locally hides the link. */
export const REPO_URL: string = import.meta.env.VITE_REPO_URL ?? ''

export const APP_NAME = 'Hushbind'
