# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Threat model (`docs/threat-model.md`).
- Crypto core for stage 1 (`src/lib/crypto`): ECDH P-256 pairing with hash commitment and
  6-digit SAS, directional per-pair code keys (HKDF), verifier with attempt limit,
  AES-GCM vault sealing.
- Encrypted on-device store (`src/lib/store`): IndexedDB via idb, non-extractable vault key,
  pairs kept only inside the sealed vault.
- Tests fail on any `console.error`/`console.warn`.
- Hash routing (`src/router`): typed routes, `#/app` contacts screen (placeholder), not-found
  page, focus and scroll handling on navigation, app screens lazy-loaded.
- Contacts screen: list from the encrypted vault, inline rename and remove with focus
  management, error state with retry, dev-only test contacts.
- `ErrorBoundary` component; `Button` accepts `ref`.
- “Your code” screen (`#/app/c/<id>/prove`): live prove code per contact, keeps the screen on
  (Wake Lock), states the “only on a call you started” rule (threat model T3).
- Lint rule `switch-exhaustiveness-check`.
- “Check a caller” screen (`#/app/c/<id>/check`): type the code you hear, 3 tries, then a
  5-minute lock with “hang up and call back”; never shows a code (threat model T1, T2, T5).
- Verifier: timed lock (`lockSeconds`) and `lockedUntil()`; one verifier per pair per session.
- Stage 0 project: Vite 8, React 19 with React Compiler, TypeScript strict, Lingui, CSS Modules
  with dark and light design tokens.
- Landing page: hero with live codes, call-scenario demo (tabs), “How it works” carousel,
  “Why it works” cards, privacy section, honest status call to action.
- RFC 6238 TOTP on Web Crypto, verified against the RFC test vectors.
- Reusable components: Button, Card, Badge, CodeDisplay, Tabs, Carousel, Section,
  SectionHeading, Reveal, Icon.
- Tests: Vitest + Testing Library + axe (52 tests), Playwright E2E on desktop and mobile with
  WCAG checks in both themes.
- GitHub Actions: lint, type-check, coverage, audit, E2E, GitHub Pages deploy. Renovate config.

### Fixed

- Parallel vault changes could overwrite each other; writes now run one at a time.
- `useTotpCode` could briefly show the previous key’s code after the key changed.
