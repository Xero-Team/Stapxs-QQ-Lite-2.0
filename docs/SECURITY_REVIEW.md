# Security review

Reviewed 2026-09-12 for the TypeScript/Electron/OneBot communication paths.

- WebSocket URLs are redacted before Electron logs and connection status IPC events. Access tokens are never included in those logs or renderer events.
- Remote updates, notices, map, media CDN, music and pinyin integrations are disabled by default and require explicit configuration.
- OneBot payloads cross a Zod validation boundary in `src/renderer/src/protocol/onebot11.ts`.
- Local persistence exposes export and clear operations through the Dexie adapter; legacy SQLite/localStorage data remains untouched until an explicit migration.
- Electron renderer security now keeps Chromium `webSecurity` enabled, preserves remote CSP and `X-Frame-Options` headers, and serves `app://` resources only from the packaged renderer directory after path normalization.
- The renderer entry point ships a same-origin CSP (`script-src 'self'`, `object-src 'none'`, and restricted resource protocols); external connections remain available only through the explicit application feature switch.
- Message and notice link rendering no longer emits inline `onclick` handlers; link actions are handled by Vue listeners, and collapsed-message data is URI encoded before being placed in an HTML attribute.

Remaining review scope: the existing renderer contains many legacy `any` boundaries and HTML rendering paths that need incremental `unknown`/schema and sanitizer migration. Full Playwright IPC coverage remains pending.
