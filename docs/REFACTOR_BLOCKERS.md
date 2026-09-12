# Refactor blockers

## 2026-09-12

- Earlier bootstrap and missing-submodule failures were resolved: Yarn 4.12.0 is available through the Corepack shim, dependencies install with `--immutable --mode=skip-build`, and the QFace/Border Card UI submodules are initialized.
- The registry's latest Vue/Vite/TypeScript/ESLint/Pinia/Electron combination is currently incompatible with this dependency graph: Vite 8 conflicts with `@vitejs/plugin-vue` 5, ESLint 10 conflicts with the installed Vue/TypeScript configs, and the TypeScript 7 patch failed during fetch. The attempted upgrade was discarded; upgrades must proceed package by package with matching plugins.
- Native `sharp@0.32.6` postinstall fails in this environment, so Yarn exits non-zero after linking even though JavaScript dependencies are available.
- `yarn npm audit --all --recursive` currently exits 1 with 192 advisories (including 3 critical findings in Handlebars, tar, and Vitest); dependency upgrades and an application impact review are required before enabling the audit as a passing release gate.

## Resolved in the current checkout

- Yarn 4.12.0 is available through the installed Corepack shim; `yarn install --immutable --mode=skip-build` completes with peer-dependency warnings.
- The QFace and Border Card UI submodules have been initialized. `yarn build` now succeeds; the previous missing `qq_emoji/_index.json` error no longer reproduces.
- Playwright CLI smoke passed against the production preview, covering the first screen, OneBot entry point, and the default disabled external-services setting.
- The smoke script now also switches the browser offline, reloads the production entry point from the local preview/service worker, and verifies the OneBot entry remains available without external resources.
- Full repository ESLint still reports legacy errors and warnings. Targeted protocol, transport, storage, network-policy, and smoke files pass their checks.
- `yarn check` was re-run after the Electron hardening work; the typecheck portion passes, while repository lint still reports 335 legacy errors (mostly `any` boundaries, generated bcui JavaScript, and legacy component naming). The failing files remain outside the migrated protocol/transport/storage gates.
- The Capacitor OneBot connector now targets Capacitor 8 and TypeScript 5.5, and its web adapter builds successfully. The npx quick-start package no longer depends on the deprecated `request` module and keeps remote updates opt-in.
- Dexie exports now have a validated `importLocalData` restore path with transactional replacement and duplicate-key resolution; a standalone migration CLI and cross-platform release verification are still outstanding.
- Transport adapters now expose common lifecycle hooks; HTTP cancellation/error transitions and malformed SSE payloads are covered by contract tests. Automatic reconnect and real server integration coverage remain outstanding.
- Core protocol, transport, storage, network, and contract-test modules now use a typed ESLint project with `consistent-type-imports` and `no-floating-promises` enforced; legacy application modules still prevent enabling the same gate repository-wide.
- Message map intermediate values and the login animation timer now use explicit unknown-safe or platform timer types; the public message handler surface still contains legacy `any` and requires a larger staged migration.
- Native download listener callbacks now use typed progress events and explicit cleanup return values; broader platform utility and message payload boundaries still need migration.
- DOM directive lifecycle state in `appUtil.ts` now uses `WeakMap` registries instead of custom `any` properties. The file no longer contains explicit `any`; message utilities and store boundaries still require migration.
- Release and release-history responses are now checked at the external boundary before rendering update dialogs, removing several untyped response callbacks.
- Optional notice responses now require a validated array/object boundary before rendering; notice template data uses `Record<string, unknown>`.
- Message path maps and list-builder inputs now use explicit JSON record types; the remaining untyped message payload APIs are isolated for later staged migration.
- Lagrange forward-message conversion now validates node and segment records before building the OneBot payload, removing an untyped forwarding boundary.
- Message value-map contracts now require string JSONPath mappings; remaining `any` is limited to legacy message list and raw-message compatibility APIs.
- Outgoing message segments and preview records now use JSON record types; only the legacy JSONPath result and parser list signatures retain `any` in `msgUtil.ts`.
- `parseMsgList` now validates unknown input into JSON records and returns typed records; the remaining `msgUtil.ts` `any` is the polymorphic JSONPath result retained for legacy map compatibility.
- Sticker cache and contact-class state now expose concrete string and class-record types; dynamic settings and chat-history stores still carry compatibility records pending the larger store migration.
- Developer diagnostics no longer dump complete settings, authentication, or UI store state to the console, preventing tokens, chat data, and local configuration from entering logs.
- JSONPath message mapping now uses an explicit query-result type and normalizes mapped list items through unknown-safe records; the legacy `jsonpath` declaration remains the compatibility boundary for later replacement.
- The initial message path loader now avoids inline `any` casts by naming its legacy JSON module shape; the broader `msg.ts` handler payload migration remains blocked on staged protocol types.
- Removed the development chat-menu action and friend-removal console output that exposed complete messages or user identifiers; remaining startup banners and structured logger output are being reviewed separately.
- Connector response storage now uses `unknown` and validates API responses as JSON records before JSONPath mapping, preventing malformed or non-object replies from crossing the protocol boundary.
