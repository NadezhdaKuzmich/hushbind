# Security policy

Hushbind exists to stop impersonation, so security bugs are the most important bugs here.

## Reporting a vulnerability

Please **don’t open a public issue**. Use GitHub private vulnerability reporting
(_Security → Report a vulnerability_). You’ll get a reply within 7 days.

## What’s in scope today (stage 0)

The site is a static landing page with a demo. It has no accounts and no server, and it stores no
user data. In scope:

- XSS or script injection into the page
- Bypass of the Content Security Policy
- Supply-chain issues in production dependencies

## Known limitations

| Limitation                                                 | Why                                     | Plan                                                      |
| ---------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| CSP delivered via `<meta>`, no `frame-ancestors`           | GitHub Pages can’t set response headers | Move to a host with headers before passkeys               |
| No HSTS preload control                                    | Same                                    | Same                                                      |
| Demo secrets are public                                    | They only drive the demo                | Real secrets are per pair, created on device (ECDH)       |
| Safari may evict site storage after 7 days without a visit | WebKit storage policy                   | Ask users to add the app to the home screen; recovery key |

## Threat model

See [docs/threat-model.md](docs/threat-model.md).

## Design principles

- Secrets are created on devices and are never sent to a server.
- Web Crypto keys are **non-extractable**: scripts can use them but can’t read the bytes.
- Passkeys only. No passwords, emails or phone numbers to leak or phish.
- The server will store only ciphertext it can’t decrypt (zero-knowledge).
