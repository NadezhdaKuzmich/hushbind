# Threat model

- **Status:** draft v1, 2026-11-12. Review before each stage.
- **Method:** assets → trust boundaries → adversaries → threats with mitigations.
  Each threat has a status: ✅ done, 🛠 planned (stage N), ⚠️ accepted risk, 🚫 out of scope.

## 1. What Hushbind protects

Hushbind answers one question during a call: **“Is this really the person they claim to be?”**
Two people who trust each other share a secret; the caller proves who they are by saying the
current 6-digit code derived from it.

It does **not** detect deepfakes, block calls or verify phone numbers.

## 2. Assets

| ID  | Asset                                            | Why it matters                              |
| --- | ------------------------------------------------ | ------------------------------------------- |
| A1  | Pair secret (32 random bytes per pair of people) | Whoever holds it can produce valid codes    |
| A2  | Local vault (all pair secrets on a device)       | Holds every A1 of this person               |
| A3  | Passkey (WebAuthn credential)                    | Unlocks the vault and the account (stage 2) |
| A4  | Recovery key                                     | Restores the vault without the device       |
| A5  | Encrypted backup on the server                   | Ciphertext of A2 (stage 2)                  |
| A6  | Integrity of the web app                         | A tampered app can leak everything above    |
| A7  | Metadata: who is paired with whom                | Reveals family and social graph             |

## 3. Trust boundaries

```
 [ Person A ]──call (untrusted)──[ Person B ]
      │                               │
 [ Device A: browser origin ]    [ Device B ]
      │  HTTPS                        │
 [ Static host: GitHub Pages ] ← [ CI: GitHub Actions ] ← [ npm registry ]
      │  HTTPS (stage 2)
 [ Sync server: Cloudflare Workers + D1 ] — stores ciphertext only
```

- **The phone call is fully untrusted**: voice can be cloned, caller ID can be spoofed.
- **The device** is trusted while unlocked and not infected with malware.
- **The server is not trusted** with secrets (zero-knowledge): it stores only ciphertext.
- **The build chain** (npm, CI, host) is trusted but hardened, because a compromise there
  reaches every user.

## 4. Adversaries

| ID  | Adversary                           | Capabilities                                                                                          |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| E1  | **Voice-clone scammer** (primary)   | A few seconds of the victim’s voice, public social media, spoofed caller ID, urgency scripts. Remote. |
| E2  | Network attacker                    | Reads or alters traffic, e.g. during remote pairing                                                   |
| E3  | Thief                               | Has the phone, locked or briefly unlocked                                                             |
| E4  | Malicious or breached server / host | Full control of the sync server or the static host                                                    |
| E5  | Supply-chain attacker               | A malicious npm package, GitHub Action or compromised maintainer account                              |
| E6  | Phishing operator                   | Look-alike domain or app, fake “support”                                                              |

## 5. Threats and mitigations

### Call verification (E1)

| ID  | Threat                                                                                                                      | Mitigation                                                                                                                                                                                                                                                                       | Status                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| T1  | Scammer guesses the code                                                                                                    | 6 digits, ±1 window → ~3 in 10⁶ per try. The verifier allows 3 attempts, then locks for 5 minutes and the UI says “hang up and call back”. The verifier lives for the whole session, so reopening the screen does not reset the count (a page reload does; the odds stay ~10⁻⁵). | ✅ (`createVerifier`, `CheckPage`)                           |
| T2  | **Reverse attack:** scammer, posing as the son, asks Mom to read _her_ code, then replays it to the son while posing as Mom | **Directional codes:** each direction has its own key (HKDF labels `initiator-to-responder` / `responder-to-initiator`). A code Mom reads out only proves Mom, so it is useless for proving the son. The verifier screen never shows a code — it only accepts one.               | ✅ (`deriveDirectionalKeys`, `CheckPage` never shows a code) |
| T3  | Live relay: scammer calls both people at once and passes codes between them                                                 | Directional codes stop the simple form (T2). A full two-call relay needs the victim to read their code on a call they did **not** start. The code screen states one rule: read your code only on a call you started; if someone calls and asks for it, hang up and call back.    | ⚠️ reduced by UI rule (`ProvePage`), accepted                |
| T4  | Code overheard or seen on screen                                                                                            | Code expires in 30–90 s and works for one direction only                                                                                                                                                                                                                         | ✅                                                           |
| T5  | Victim is pressured to skip the check (“no time”, “app is broken”)                                                          | UX copy: _a real relative never refuses the code; if they do, hang up and call back on the number you know_. Shown on the check screen, under the code field.                                                                                                                    | ✅ copy on `CheckPage`; 🛠 3 onboarding                       |
| T6  | Caller ID spoofing                                                                                                          | Not relied on at all; that is the point of the code                                                                                                                                                                                                                              | ✅ by design                                                 |
| T7  | Clock skew between phones                                                                                                   | ±1 window (90 s total); warn if a device clock looks wrong when online                                                                                                                                                                                                           | 🛠 1                                                          |

### Pairing (E1, E2)

| ID  | Threat                                                        | Mitigation                                                                                                                                                | Status                         |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| T8  | Man-in-the-middle during remote pairing swaps public keys     | ECDH P-256 + **hash commitment** + **6-digit SAS** compared by both people. The commitment stops a MITM from grinding keys until both SAS values collide. | ✅ core (`pairing.ts`), 🛠 1 UI |
| T9  | Attacker MITMs pairing _and_ clones the voice reading the SAS | Recommend in-person QR pairing. For remote: compare the SAS on a video call or after calling back a known number; UI states this explicitly.              | 🛠 1                            |
| T10 | Pairing invite link leaked or reused                          | Single use, expires in 10 min, carries only a public key, useless without the SAS                                                                         | 🛠 1                            |
| T11 | Weak randomness                                               | Only `crypto.getRandomValues` and Web Crypto key generation                                                                                               | ✅                             |

### Device (E3)

| ID  | Threat                                   | Mitigation                                                                                                          | Status          |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------- |
| T12 | Thief opens the app on an unlocked phone | App lock: passkey / biometric check (WebAuthn user verification) before codes are shown; auto-lock after inactivity | 🛠 2             |
| T13 | Data extracted from a locked phone       | Vault encrypted with AES-GCM; key derived from the passkey PRF extension; keys non-extractable in Web Crypto        | 🛠 1–2           |
| T14 | Lost phone keeps working for the thief   | Any paired person can revoke a pair; re-pair creates a fresh secret                                                 | 🛠 2             |
| T15 | Malware or root on the device            | Can read anything the user can                                                                                      | 🚫 out of scope |

### Web app integrity (E5, E6)

| ID  | Threat                                  | Mitigation                                                                                                                                | Status                                        |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| T16 | XSS injects a script that reads secrets | Strict CSP (`script-src 'self'`), no `innerHTML`/`dangerouslySetInnerHTML`/`eval` (lint-enforced), React escaping, non-extractable keys   | ✅                                            |
| T17 | Clickjacking in an iframe               | Needs `frame-ancestors`, which only works as an HTTP header                                                                               | ⚠️ until a host with headers (before stage 2) |
| T18 | Malicious npm package                   | Lockfile + `npm ci`, few runtime deps, Renovate waits 7 days before adopting releases, `npm audit` in CI                                  | ✅                                            |
| T19 | Compromised GitHub Action               | Actions pinned to commit SHA, least-privilege `GITHUB_TOKEN`, deploy job is the only one with `pages: write`                              | ✅                                            |
| T20 | Maintainer account takeover             | Passkey/2FA on GitHub, signed commits, branch protection on `main`                                                                        | 🛠 0 (setup)                                   |
| T21 | Look-alike domain hosting a fake app    | **Passkeys are bound to the real origin**, so a fake site cannot use them. Own the main domain before stage 2; document the official URL. | 🛠 2                                           |

### Server and account (E4, E6)

| ID  | Threat                                                  | Mitigation                                                                                                                                             | Status      |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| T22 | Server breach exposes secrets                           | Zero-knowledge: server stores only AES-GCM ciphertext; keys never leave devices                                                                        | 🛠 2         |
| T23 | Server reveals who is paired with whom                  | Random pair IDs, no contact lists, no phone numbers or emails stored                                                                                   | 🛠 2         |
| T24 | Server deletes or withholds data                        | Local vault is the source of truth; recovery key restores from any backup copy                                                                         | 🛠 2         |
| T25 | Account takeover via “forgot password” or fake support  | No passwords, emails or phone numbers exist, so there is nothing to reset. Recovery only with the recovery key (later: 2-of-3 trusted people, Shamir). | 🛠 2         |
| T26 | Safari evicts site storage after 7 days without a visit | Ask users to add the app to the Home Screen; recovery key; re-pair flow                                                                                | ⚠️ accepted |

## 6. Out of scope

- A fully compromised device (malware, root, jailbreak).
- Coercion: someone forcing a person to read their code.
- An attacker physically present with the person.
- Detecting synthetic voices or video.

## 7. Design decisions this model produced

1. **Directional codes** (T2): one HKDF-derived key per direction, not one shared code.
2. **Verifier never sees a code** (T2): two modes, _“Prove it’s me”_ (shows my code) and
   _“Check the caller”_ (enter the code you hear).
3. **Attempt limit + call-back advice** (T1, T5).
4. **SAS is mandatory** for pairing, with a warning that a voice reading it can be cloned (T9).
5. **Move to a host with HTTP headers before stage 2** (T17, T21).

## 8. Review triggers

Revisit this document when: a new data type is stored, the server API changes, a new
platform ships (native app), or any security bug is reported.
