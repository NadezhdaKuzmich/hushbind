# Hushbind

[![CI](https://github.com/NadezhdaKuzmich/hushbind/actions/workflows/ci.yml/badge.svg)](https://github.com/NadezhdaKuzmich/hushbind/actions/workflows/ci.yml)

**Live demo:** https://nadezhdakuzmich.github.io/hushbind/

An anti-voice-clone authenticator for people who trust each other: family, friends, colleagues.
Each pair shares a secret; on a suspicious call, the caller proves who they are with a 6-digit
code that changes every 30 seconds.

> **Status:** stage 0, landing page with a live demo. An open-source pet project, not a commercial
> product. Accounts (passkeys) arrive in stage 2; the iOS app is in development and won’t be
> published to the App Store for now.

## Quick start

```bash
nvm use            # Node 24 (see .nvmrc), Vite 8 needs ≥ 22.12
npm ci             # exact versions from package-lock.json
npm run dev        # http://localhost:5173
```

## Scripts

| Command                | What it does                                                                    |
| ---------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server with HMR                                                             |
| `npm run build`        | Type-check, then production build into `dist/`                                  |
| `npm run preview`      | Serve `dist/` locally, the same files GitHub Pages gets                         |
| `npm run check`        | Format check, lint, type-check and unit tests. Run before push                  |
| `npm test`             | Unit and component tests (Vitest)                                               |
| `npm run coverage`     | Tests with coverage report; fails under 85 % lines/functions                    |
| `npm run e2e`          | Browser tests on desktop and mobile, plus axe accessibility checks (Playwright) |
| `npm run i18n:extract` | Update `messages.po` after changing UI text                                     |
| `npm run format`       | Format all files with Prettier                                                  |

## Project structure

```
src/
  components/      Reusable UI, no business logic. One folder each:
    Button/          Button.tsx, Button.module.css, Button.test.tsx, index.ts
    Carousel/  Tabs/  Card/  Badge/  CodeDisplay/  Section/  SectionHeading/  Reveal/  Icon/
  features/
    landing/       Page sections. Features may use components, never the reverse
  layout/          SiteHeader, SiteFooter
  lib/totp/        RFC 6238 codes on Web Crypto. Pure functions, no React
  hooks/           useTotpCode, useInView, usePrefersReducedMotion
  i18n/            Locale detection and loading, catalogs in locales/<lang>/messages.po
  styles/          tokens.css (design tokens, dark + light), global.css, animations
  test/            setup, render with providers, axe helper
e2e/               Playwright specs
```

Dependency direction: `features → components → lib`. `lib` knows nothing about React, so the
same crypto code will move to the native app unchanged.

## Conventions

- **TypeScript strict**, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **Every component** has TSDoc on its props, a CSS Module, a test with an axe check, and an
  `index.ts` that is its only public entry.
- **No manual `useMemo`/`useCallback`/`memo`.** React Compiler memoizes automatically. Add one
  only when a profiler shows a problem and the compiler can’t handle it.
- **All UI text** goes through Lingui macros (`<Trans>`, `` t`…` ``, `<Plural>`).
- **CSS:** design tokens only, no raw colors in modules. One property per line.
- **Accessibility:** WCAG 2.2 AA. Every animation stops with `prefers-reduced-motion`, and touch
  targets are at least 48 px.
- **Security:** no `dangerouslySetInnerHTML`, `innerHTML`, `eval` (ESLint blocks them). A strict
  CSP is injected into the built `index.html`.

## Security notes

- GitHub Pages can’t send custom headers, so the CSP is a `<meta>` tag, and `frame-ancestors`
  is unavailable there. Before stage 2 (passkeys) the site moves to a host with real headers. See
  [SECURITY.md](SECURITY.md).
- The demo secrets in `src/features/landing/demoKeys.ts` are **public on purpose**.
- `npm audit --omit=dev --audit-level=high` runs in CI. Dev-only advisories (for example
  inside lint tooling) don’t ship to users and are reviewed rather than blocking.

## Libraries and why

| Library                                                                                                                                                                                                                    | Why                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [React 19](https://react.dev)                                                                                                                                                                                              | UI, with `use()` for async resources                                 |
| [React Compiler](https://react.dev/learn/react-compiler)                                                                                                                                                                   | Automatic memoization at build time                                  |
| [Vite 8](https://vite.dev)                                                                                                                                                                                                 | Dev server and bundler (Rolldown)                                    |
| [TypeScript](https://www.typescriptlang.org)                                                                                                                                                                               | Pinned to 6.0 until typescript-eslint supports 7                     |
| [Lingui](https://lingui.dev)                                                                                                                                                                                               | i18n with ICU messages, compiled at build time, small runtime        |
| [Fontsource](https://fontsource.org)                                                                                                                                                                                       | Self-hosted fonts: no Google request, works with strict CSP          |
| [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro)                                                                                                             | Unit and component tests that query like a user                      |
| [axe-core](https://github.com/dequelabs/axe-core)                                                                                                                                                                          | Automated accessibility checks in unit and E2E tests                 |
| [Playwright](https://playwright.dev)                                                                                                                                                                                       | Real-browser E2E, desktop and mobile                                 |
| [ESLint](https://eslint.org) + [typescript-eslint](https://typescript-eslint.io) + [jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) + [react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) | Static checks, including rules of React and accessibility            |
| [Prettier](https://prettier.io)                                                                                                                                                                                            | Formatting, so code review is about substance                        |
| [Renovate](https://docs.renovatebot.com)                                                                                                                                                                                   | Weekly dependency updates, waits 7 days before adopting new releases |

Standards: [RFC 6238 TOTP](https://www.rfc-editor.org/rfc/rfc6238),
[WAI-ARIA APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) and
[Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/),
[WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Threat model

What we defend against and how: [docs/threat-model.md](docs/threat-model.md).

## Roadmap

0. **Landing + live demo** (this)
1. Crypto core: pairing (ECDH + SAS), directional codes, encrypted local vault
2. Accounts: passkeys, recovery key, zero-knowledge sync on Cloudflare Workers
3. About page, onboarding, app screens
4. Native iOS app (TestFlight / own devices)

## License

[MIT](LICENSE)
