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
