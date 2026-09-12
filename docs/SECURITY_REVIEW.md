# Security review

Reviewed 2026-09-12 for the TypeScript/Electron/OneBot communication paths.

- WebSocket URLs are redacted before Electron logs and connection status IPC events. Access tokens are never included in those logs or renderer events.
- Remote updates, notices, map, media CDN, music and pinyin integrations are disabled by default and require explicit configuration.
- OneBot payloads cross a Zod validation boundary in `src/renderer/src/protocol/onebot11.ts`.
- Local persistence exposes export and clear operations through the Dexie adapter; legacy SQLite/localStorage data remains untouched until an explicit migration.

Remaining review scope: the existing renderer contains many legacy `any` boundaries and should be migrated to `unknown` plus schema validation incrementally. Full Playwright IPC coverage remains pending until the missing face asset is restored.
