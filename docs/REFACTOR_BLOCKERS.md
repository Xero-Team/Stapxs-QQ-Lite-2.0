# Refactor blockers

## 2026-09-12

- Capacitor navigation-bar peer incompatibility resolved on 2026-09-13 by replacing the Capacitor 4–6-only `@hugotomazi/capacitor-navigation-bar` with `@capgo/capacitor-navigation-bar` 8.2.7 (peer `@capacitor/core >=8`). Android Gradle and iOS Pod references were migrated; Web build, core typecheck, and 77 contract tests pass. Native device builds remain covered by the cross-platform CI matrix.
- Reproducible artifact checksum generation is now available via `yarn generate:artifact-checksums dist /tmp/SHA256SUMS`; local verification checked all 90 production files successfully. `yarn verify:release-metadata dist` also passes after SBOM regeneration. A checked-in `SHA256SUMS` is intentionally not committed because release checksums must be generated from immutable CI artifacts.
- Repository policy gate added on 2026-09-13: `yarn verify:repository-policy` rejects source files over 3000 lines and non-Conventional-Commit latest subjects. Current tree passes; existing Chat/App/message modules remain below the threshold but still require architectural extraction.
- Node/Electron project strictness expanded on 2026-09-13: `tsconfig.node.json` now explicitly enables `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `useUnknownInCatchVariables`; Electron IPC, TouchBar, network scan, response-header, and Vite plugin boundaries were fixed. `tsc --noEmit -p tsconfig.node.json` passes. Web renderer still has 340 errors when the same flags are applied and remains open.
- Tauri warning cleanup completed on 2026-09-13: platform-only imports/state are now cfg-scoped, the unused service stub was removed, and download/menu parameters use consistent snake_case or explicit non-macOS suppression. `yarn lint:tauri` passes with no warnings on Linux.

- Earlier bootstrap and missing-submodule failures were resolved: Yarn 4.12.0 is available through the Corepack shim, dependencies install with `--immutable --mode=skip-build`, and the QFace/Border Card UI submodules are initialized.
- The registry's latest Vue/Vite/TypeScript/ESLint/Pinia/Electron combination is currently incompatible with this dependency graph: Vite 8 conflicts with `@vitejs/plugin-vue` 5, ESLint 10 conflicts with the installed Vue/TypeScript configs, and the TypeScript 7 patch failed during fetch. The attempted upgrade was discarded; upgrades must proceed package by package with matching plugins.
- Native `sharp@0.32.6` postinstall fails in this environment, so Yarn exits non-zero after linking even though JavaScript dependencies are available.
- `yarn npm audit --all --recursive` currently exits 1 with 192 advisories (including 3 critical findings in Handlebars, tar, and Vitest); dependency upgrades and an application impact review are required before enabling the audit as a passing release gate.
- A fresh `yarn npm audit --all` on 2026-09-13 still exits 1; it reports high/critical issues in `jsonpath`, `rollup`, and `vitest`, plus moderate findings in `echarts`, `markdown-it`, `uuid`, and `ws`. No upgrade is applied yet because each requires compatibility review.
- The Electron renderer/main/preload build was re-run locally with `yarn electron-vite build` and completed successfully; Windows/macOS signing and packaged installer validation remain outstanding.
- `vue-tsc` is now pinned to the stable 3.3.11 line for the resolved TypeScript 5.9.3 toolchain. The renderer typecheck still reports legacy cross-platform listener callback errors and one strict error inside the `vue3-bcui` package; the build and contract tests pass, but no green typecheck is claimed until those boundaries are migrated or the dependency is replaced.

## Resolved in the current checkout

- Yarn 4.12.0 is available through the installed Corepack shim; `yarn install --immutable --mode=skip-build` completes with peer-dependency warnings.
- A repository `.node-version` file now pins the supported Node 22.14.0 runtime used by the CI workflows; Yarn remains pinned through `packageManager` at 4.12.0.
- The QFace and Border Card UI submodules have been initialized. `yarn build` now succeeds; the previous missing `qq_emoji/_index.json` error no longer reproduces.
- Playwright CLI smoke passed against the production preview, covering the first screen, OneBot entry point, and the default disabled external-services setting.
- The smoke script now also switches the browser offline, reloads the production entry point from the local preview/service worker, and verifies the OneBot entry remains available without external resources.
- Full repository ESLint currently exits successfully with 7,282 legacy warnings and no errors, primarily from application and plugin formatting rules. Generated Vite cache, service-worker, BCUI, and plugin `dist` outputs are excluded from the flat-config gate; targeted protocol, transport, storage, network-policy, and smoke files pass their checks.
- `yarn check` was re-run after the Electron hardening work; the typecheck portion passes, while repository lint remains red because legacy and generated code are outside the migrated protocol/transport/storage gates.
- The Capacitor OneBot connector now targets Capacitor 8 and TypeScript 5.5, and its web adapter builds successfully. The npx quick-start package no longer depends on the deprecated `request` module and keeps remote updates opt-in.
- Dexie exports now have a validated `importLocalData` restore path with transactional replacement and duplicate-key resolution; a standalone migration CLI and cross-platform release verification are still outstanding.
- Transport adapters now expose common lifecycle hooks; HTTP cancellation/error transitions and malformed SSE payloads are covered by contract tests. A shared `ReconnectingTransport` now owns bounded exponential retry, cancellation, explicit-close handling, and reconnect-after-drop behavior; it is wired into the renderer WebSocket connector. Live server integration remains outstanding.
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
- The initial message path loader now avoids inline `any` casts by naming its legacy JSON module shape; `msg.ts` handler payloads and message merge/forward helpers now use unknown-safe records and have no explicit `any`. Remaining application `any` is concentrated in the option registry, information model, and legacy Vue payloads.
- Removed the development chat-menu action and friend-removal console output that exposed complete messages or user identifiers; remaining startup banners and structured logger output are being reviewed separately.
- Connector response storage now uses `unknown` and validates API responses as JSON records before JSONPath mapping, preventing malformed or non-object replies from crossing the protocol boundary.
- All GitHub Actions dependency-install steps now use `yarn install --immutable --mode=skip-build`, matching the reproducible install path that avoids the environment's native `sharp` postinstall failure; the quality workflow remains red until legacy lint and audit findings are resolved.
- The `lint` script is now a non-mutating check for CI; the previous auto-fixing behavior is available explicitly as `lint:fix`, so failed gates cannot rewrite a checkout during validation.
- README contributor avatars and the remote Star History widget were removed, along with their unused contributor-card CSS, so project documentation no longer fetches upstream identity or analytics-style external widgets.
- Renderer source headers now identify Xero-Team instead of the upstream author label; third-party dependency names and license notices remain unchanged.
- Removing the obsolete Umami style override also exposed a stray CSS declaration in the full-vibrancy stylesheet; it is now removed and the production Vite build completes without CSS syntax warnings.
- Tauri workflows now use the maintained `dtolnay/rust-toolchain@stable` action instead of the archived `actions-rs/toolchain`; local `cargo check` passes with existing warning-only legacy code diagnostics.
- Connector request timeouts now remove their pending echo entry before rejecting, preventing timed-out API calls from accumulating in the response map.
- Connector inbound messages now reject invalid JSON, non-object payloads, and malformed OneBot events/API responses before dispatch; valid payloads continue through the existing echo and event handlers.
- Connector API and send helpers now accept JSON records, parse `sendRawJson` defensively, and expose unknown-safe response storage; callers explicitly handle absent API results when merging forward messages or awaiting delete calls.
- Voice-record loading now validates the `get_record` result as an object before reading base64 data, removing another explicit `any` boundary while preserving OneBot response compatibility.
- Message dispatch and notification logging no longer embeds raw JSON, parsed segments, handler payloads, or message text in log strings; message content remains available only to the notification UI.
- URI handling and voice-record failure logs now emit generic messages instead of serializing URI or API response values, closing two remaining sensitive string logging paths.
- Heartbeat and request notification handlers now accept the shared `MessagePayload` record type; heartbeat timestamps are numerically validated before updating the watchdog state.
- Emoji-like, group-ban, kick, and input-status notice handlers now share the typed payload boundary; group IDs, durations, and localized status text are normalized before use.
- Poke notice rendering now validates each raw-info segment before reading its type, source, or text, removing another untyped segment callback.
- Group-approval notices now consume the shared message payload record while retaining the existing member refresh and join notification behavior.
- The event handler registry and version/login handlers now use shared payload records with explicit app/version and account field validation before updating runtime state.
- Group/friend list, category, member, and legacy login-info handlers now accept typed message records; nested legacy login data is traversed with object/array guards before store mutation.
- Group-member sorting and delayed pinyin enrichment now use `GroupMemberInfoElem` callbacks instead of untyped array items.
- Mapped login/version responses now cross a dedicated Zod boundary. Numeric OneBot account IDs are normalized to strings before updating authentication state and connection history; missing/malformed fields are rejected and backend extension fields survive. This fixes the string-only login guard introduced during the handler type migration.
- Login normalization validation: all 53 contract tests, renderer `vue-tsc`, targeted ESLint, `git diff --check`, and the production Vite build pass. A fresh Playwright CLI session completes the Lagrange mock handshake with numeric `user_id` and sends the subsequent friend/group/cookie requests. Reusing the earlier session initially loaded an old service-worker-cached bundle; smoke checks must use fresh browser state.
- The current shell has Node 26.8.2 and `npx`, but no `yarn` or `corepack` on PATH (the earlier successful Yarn runs above used a different tool setup). This phase ran the installed `node_modules/.bin` tools directly; it does not establish a passing `yarn check`, and the existing repository-wide lint/audit failures remain unresolved.
- Broader login smoke found a Tencent avatar request from the hidden connection-history list and an unhandled Amap missing-key error on startup. Account/group avatar URLs across renderer views and notification construction now go through a shared opt-in policy with a local placeholder and validated identifiers. Map initialization moved from application startup to the map card and requires both opt-in and a configured key.
- Privacy repair validation: 68 contract tests, renderer typecheck, focused ESLint, and the production Vite build pass. Both Lagrange and NapCat log in with numeric and string IDs in isolated browser contexts without third-party HTTP requests or page exceptions; the existing first-start/offline smoke also passes. Live map loading, media flows, native notifications, and other full end-to-end scenarios remain unverified.
- The committed OneBot Playwright CLI smoke covers all four backend/ID combinations, welcome completion, backend-specific initialization (including NapCat recent contacts), persisted string account IDs, and disabled external services. Both smoke runners pin CLI 0.1.19, use fresh temporary sessions, clean up on exit, and keep diagnostics in ignored `output/playwright/`; the OneBot runner fails on incomplete structured results. The full Playwright checklist remains open.
- The quality workflow now runs the OneBot login smoke, lints its script and avatar policy, and installs Chromium from the same pinned CLI as the smoke runners. Dependency audit is an independent, required-to-pass job so existing advisories cannot skip later browser checks. Workflow YAML and shell syntax were checked locally; no GitHub Actions run or passing full CI is claimed, and the existing lint/audit/native-release blockers still apply.
- Release artifact checksum verification was exercised locally against every file in the production `dist/` output using `scripts/verify-artifacts.sh`; signing and platform-specific release bundles remain unverified.
- The OneBot smoke now includes synthetic text and image send/receive coverage. Chromium validation passed all four Lagrange/NapCat account-type scenarios, including UI text send, server-pushed receive, and an image segment payload; no live bot credentials are used. Recall/reply and file flows remain unverified.
- A compatible web-toolchain slice is now upgraded and isolated: Vue 3.5.42, Vite 7.3.6, `@vitejs/plugin-vue` 6.0.8, `vite-plugin-pwa` 1.3.0, and electron-vite 5.0.0. Web build, Electron renderer build, `vue-tsc`, immutable skip-build installation, and 68 contract tests pass. Vite 8 is intentionally not used because electron-vite 5 and the remaining renderer plugins currently support Vite 7 at most; the upgrade of the remaining framework, lint, test, and native stacks is still pending.
- The Vite 7 migration required resolving the shared renderer factory eagerly in `electron.vite.config.ts`; electron-vite 2's `splitVendorChunk` export was incompatible with newer Vite. Peer warnings remain for `vite-plugin-inspect` through Vue DevTools, Capacitor navigation-bar ranges, and the existing ECharts/Vue-ECharts mismatch. These are tracked compatibility work, not suppressed with `skipLibCheck` or Yarn peer overrides.
- Electron 44.3.0 and electron-builder 26.15.3 now build successfully with electron-vite 5 and Vite 7.3.6; the renderer config migration is covered by the same Electron build check. The Capacitor navigation-bar plugin remains on 4.0.1 and declares only Capacitor 4–6, so upgrading the Capacitor core/plugins to 8.5.x requires replacing or validating that native implementation first.
- `runtime/backend.ts` now uses unknown-safe Capacitor plugin/callback and User-Agent boundaries; its explicit `any` count is zero. Renderer typecheck, focused ESLint, and all 68 contract tests pass after this change. The generic `call`/legacy platform IPC surface still needs a typed command result model before the remaining Store and application `any` can be removed.
- Renderer ambient declarations now avoid explicit `any`: Vue modules use the default `DefineComponent`, YAML modules expose JSON records, and optional platform globals use concrete function/record types. Store, message, and legacy component payloads still require staged migration before the repository-wide `any` goal can be enabled.
- The backend listener field now uses one unknown-safe callable boundary across Electron, Tauri, and Capacitor, and Capacitor response unwrapping guards object results before indexing. Renderer typecheck is green after migrating the legacy callback call sites; the third-party `vue3-bcui` tab component remains isolated behind a TypeScript shim.
- Renderer listener callbacks now validate runtime event records, IDs, URLs, connection status, mobile connector JSON, and notification payloads before use. The viewer's Capacitor image path uses the same backend adapter and validates base64 data. The shim is type-only and does not alter the runtime package.
- Qzone feed records and system notices now have explicit store types, with numeric/string IDs and optional protocol fields normalized at the UI boundary. Authentication, settings, chat history, and message payload stores still carry dynamic compatibility records for the next staged migration.
- Chat store message, merged message, and merged image arrays now expose the existing `MsgItemElem` domain type; legacy command-line and pre-send records cross that boundary through explicit unknown casts. This removes the store-level `any` declarations while preserving the existing heterogeneous message list.
- Authentication state now has explicit login history, quick-login, profile, Web API cache, bot metadata, and JSONPath map types; runtime reset and login response assignment restore the complete login shape. The map uses a typed known-key surface plus a guarded dynamic entry accessor.
- JSONPath maps now pass through a dedicated Zod loader (`protocol/json-map.ts`) that requires a non-empty name and preserves protocol-specific extension keys. Loader and redirect paths are covered by seven contract assertions; legacy map values are adapted at the small number of dynamic parser call sites.
- Settings state now exposes an explicit `SystemConfig` contract for the persisted defaults and validates saved-token values before decoding; loaded developer configuration crosses the boundary through a typed assertion. The remaining dynamic option registry and JSONPath map are tracked for adapter migration.

## Effective TypeScript configuration audit (2026-09-13)

`vue-tsc --showConfig -p tsconfig.web.json` reports `strict: true` but omits
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Setting these flags
on the root reference project did not enable them in its children. Running the
Web typecheck with both flags explicitly produced 359 errors (40 in `msg.ts`,
33 in `appUtil.ts`, 32 in `Chat.vue`, among other modules). The checklist's
previous completed flag was therefore incorrect and has been reopened.

`tsconfig.core.json` now enforces all requested flags for protocol, transport,
storage and network modules and runs as part of `yarn typecheck`.
`tests/browser/tsconfig.json` enforces the same flags for the XML harness.
The migration must expand to the Web and Node projects before the full strict
item can be checked off. No compiler flags were disabled to pass these checks.

## Dependency audit refresh (2026-09-13, full recursive graph)

`npx --yes corepack@0.31.0 yarn npm audit --all --recursive` exits 1 after
reporting 142 advisory entries across 56 packages: 3 critical, 80 high, 53
moderate, and 6 low. The upgraded direct packages (`jsonpath`, `echarts`,
`markdown-it`, and `uuid`) no longer appear as direct vulnerable nodes, but
transitive findings remain in the build and test toolchain. Notable blockers
include `sharp@0.32.6` (libvips/libheif), `tar` from Capacitor tooling,
`postcss`/`nanoid` from Vite, `rollup` from the connector workspace, and
`vitest@2.1.9`. These require compatibility upgrades or replacement before the
recursive audit can become a passing release gate; this result is retained as
the current evidence rather than being suppressed.

## Dependency audit refresh (2026-09-13)

Upgraded direct vulnerable dependencies: `jsonpath` 1.3.0, `echarts` 6.1.0,
`markdown-it` 14.3.2, `uuid` 11.1.1, `ws` 8.21.3, and Vitest 3.2.6. A fresh
recursive audit still exits 1 with 137 advisory entries across 54 packages
(2 critical, 79 high, 50 moderate, 6 low). Remaining exposure is primarily
transitive build tooling (`sharp`, `tar`, `postcss`, `nanoid`, Rollup), plus
Vitest's current transitive mocker advisory and deprecated Vue I18n 10. These
upgrades require compatibility work and remain release blockers. Contract
tests pass after the dependency refresh; Yarn's optional `sharp` native build
is still environment-dependent.

## Lint verification (2026-09-13)

ESLint 9.39.5 with `@typescript-eslint` 8.70.0 now runs the repository flat
config successfully: the command exits 0 with 7,285 warnings and no errors.
The warnings are legacy formatting and console diagnostics; they remain
tracked cleanup work, while the previous ESLint 8 runtime API failure is
resolved.
