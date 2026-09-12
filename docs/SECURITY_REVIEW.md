# Security review

Reviewed 2026-09-12 for the TypeScript/Electron/OneBot communication paths.

- WebSocket URLs are redacted before Electron logs and connection status IPC events. Access tokens are never included in those logs or renderer events.
- Remote updates, notices, map, media CDN, music and pinyin integrations are disabled by default and require explicit configuration.
- OneBot payloads cross a Zod validation boundary in `src/renderer/src/protocol/onebot11.ts`.
- Local persistence exposes export and clear operations through the Dexie adapter; legacy SQLite/localStorage data remains untouched until an explicit migration.
- Electron renderer security now keeps Chromium `webSecurity` enabled, preserves remote CSP and `X-Frame-Options` headers, and serves `app://` resources only from the packaged renderer directory after path normalization.
- The renderer entry point ships a same-origin CSP (`script-src 'self'`, `object-src 'none'`, and restricted resource protocols); external connections remain available only through the explicit application feature switch.
- Electron `sys:getHtml`, `sys:getApi`, and redirect resolution IPC handlers accept only bounded HTTP(S) URLs; link preview failures and resolved targets are not written to logs.
- OneBot and native storage logs redact message payloads, account identifiers, URLs, and filesystem paths; native WebSocket errors use generic diagnostics.
- Message and notice link rendering no longer emits inline `onclick` handlers; link actions are handled by Vue listeners, and collapsed-message data is URI encoded before being placed in an HTML attribute.
- Login smoke exposed an unguarded Tencent avatar request from the hidden connection-history list. Renderer account/group avatar construction now uses one validated boundary with a local SVG placeholder until external services are explicitly enabled. Notification avatars use the same policy; account values are never included in policy diagnostics.
- Amap initialization was running at startup and throwing an unhandled missing-key error even with integrations disabled. It now runs only for a map card with explicit external-service opt-in and a configured key; otherwise the location's address remains visible. The remote map SDK with opt-in and native platform behavior still need separate verification.

Remaining review scope: the existing renderer contains many legacy `any` boundaries and HTML rendering paths that need incremental `unknown`/schema and sanitizer migration. Full Playwright IPC coverage remains pending.

## XML card follow-up (2026-09-13)

- **XML-01 / JS-XSS-001, high (fixed):** `XmlSegComp.vue` previously assigned
  message-controlled strings to two detached HTML elements before the final XSS
  filter. Detached HTML parsing can initiate media requests and the final filter
  cannot undo those effects. Protocol extraction now uses `DOMParser` in XML mode
  (`protocol/xml-card.ts`); the resulting discriminated record is rendered by
  `XmlCardBody.vue` through Vue text interpolation, without any HTML sink.
- **XML-02 / privacy, medium (fixed):** XML cover URLs previously loaded without
  external-service opt-in. The presentation component mounts images only when
  explicitly enabled, sends no referrer, and records only the origin locally.
  The parser accepts HTTP(S) URLs without embedded credentials, rejects DTD/entity
  declarations, bounds payload length and title size, and drops unknown markup.
- Normal title/summary words are no longer altered by global tag-name replacements.
  Replacing a card recomputes its link, so an old link cannot remain on invalid or
  unsupported content. Clicks emit a validated URL to the existing platform opener.
- Validation: 9 Chromium component scenarios pass through the pinned Playwright CLI,
  including hostile attributes/CDATA, malformed XML, DTD, offline use, opt-in and
  opt-out. The isolated harness intentionally has no CSP so the injection test
  exercises the renderer rather than relying on a policy to hide unsafe code.
  Full OneBot media and native WebView flows remain outside this evidence.
