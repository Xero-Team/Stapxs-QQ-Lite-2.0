# Local data migration

Existing localStorage and SQLite data remains readable through the legacy adapters. New persistence work must use a versioned schema and preserve an export-before-upgrade path. Users can export JSON, clear cached media, or clear all local data from Settings. Destructive migration is never automatic; an incompatible record is retained in the legacy store and reported locally. Diagnostic tooling can restore a validated export with `importLocalData(JSON.parse(json), true)`; replacement runs in one Dexie transaction and keeps the newest value for duplicate keys.
