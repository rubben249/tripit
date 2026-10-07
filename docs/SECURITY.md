# Security notes

What the pre-deploy audit (2026-10-07) checked, what was changed, and the two
things that are deliberately left as they are. Read this before re-litigating an
`npm audit` result.

## Shape of the threat model

Trips never leave the device. Supabase holds exactly three tables — `profiles`,
`allowed_emails` and `share_sessions` — and the app only ever calls Auth and the
two share RPCs. There is no server-side copy of anyone's itinerary to leak.

Sharing is end-to-end encrypted on-device (AES-GCM, PBKDF2-SHA256 150k, 8-char
code from a 31-letter alphabet). The server stores a SHA-256 of the code and the
ciphertext for three minutes; it never sees the code, the key or the trip.
`share_sessions` has RLS enabled and **no policies at all**, so clients cannot
read or list it — only the two `SECURITY DEFINER` functions touch it.

## Deployment hardening

`netlify.toml` is the source of truth for the response headers. The CSP there
carries no `'unsafe-eval'`; every allowance in it was checked against the real
exported bundle, and the whole app (map, local SQLite, WebCrypto sharing, a live
Supabase RPC) was driven in a browser under those exact headers with zero
violations. If a dependency is added that needs a new origin, add it to
`connect-src` rather than widening `default-src`.

`profiles` used to be readable in full by any signed-in member, which exposed
everyone's email address for a directory feature the app does not have. It is
now own-row plus admin (migration `20261007000000_restrict_profile_email_exposure`).
If a member directory is ever built, give it a view that selects only
`id`/`display_name`/`avatar_url` instead of reopening the table.

## Dependencies

`maplibre-gl` was pinned to 5.x because v6 is ESM-only and Metro cannot resolve
its worker. Every release through 6.4.0 carries a critical XSS sanitizer bypass
(GHSA-jrc7-96c5-q579) that was never backported to the 5.x line, so staying was
not an option: the app is on 6.x and serves the worker itself
(`scripts/sync-maplibre-worker.mjs` + `setWorkerUrl` in `GlobeMap.web.tsx`).

**`npm audit` reports ~66 findings and none of them reach the browser.** They are
all inside Expo's and Jest's build toolchain. Each was traced to its consumer and
searched for in the exported bundle; none appears there:

| Package | Pulled in by | Patched version? |
| --- | --- | --- |
| `braces` | `micromatch`, used by Metro/Jest globbing | none published |
| `node-forge` | `@expo/cli`, `@expo/code-signing-certificates` | none published |
| `sprintf-js` | `argparse` ← Jest's coverage plugin | none published |
| `uuid@7` | `xcode` ← `@expo/config-plugins` (native prebuild) | major, via `expo` |
| `decode-uri-component` | `query-string` ← `expo-router` | 0.5.0, but ESM-only |

An `overrides` entry does not help: the first three have no fixed release at all,
and `decode-uri-component@0.5.0` is ESM-only while `query-string@7` `require()`s
it, so pinning it would break the build. `npm audit fix --force` "resolves" these
by downgrading to `expo@44` — do not run it.

Re-check when the Expo SDK is upgraded; that is what will clear them.

## Still open, on purpose

**The invite-only gate is dashboard config.** `public.check_allowed_email` is
registered as a `before_user_created` Auth Hook by hand (Authentication → Hooks)
— SQL and the CLI cannot deploy it. It is verified working on the current
project, but a restored or re-created project needs that step repeated or signup
is silently open. Login is currently built but unused.

**`docs/ejemplo_itinerario.pdf` holds a real trip in a public repo.** Booking
locators, flights and hotels from August–September 2024; no names, emails, card
or phone numbers. The trip is long since travelled, so the locators are spent,
and the file is the fixture the Fase 3 validation cases are written against.
Removing it properly would mean rewriting published history, so it stays unless
that trade stops being worth it.
