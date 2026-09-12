# Local data migration

Existing localStorage and SQLite data remains readable through the legacy adapters. New persistence work must use a versioned schema and preserve an export-before-upgrade path. Users can export JSON, clear cached media, or clear all local data from Settings. Destructive migration is never automatic; an incompatible record is retained in the legacy store and reported locally. Diagnostic tooling can restore a validated export with `importLocalData(JSON.parse(json), true)`; replacement runs in one Dexie transaction and keeps the newest value for duplicate keys.

## Standalone migration command

When a diagnostic or release environment cannot access browser IndexedDB, convert a JSON export to the record array accepted by `importLocalData`:

```bash
yarn data:migrate --input legacy.json --output xero-local-data.json
```

The input may be an `exportLocalDataJson()` array or a legacy key/value object. Legacy objects are placed in the `legacy-localstorage` namespace and use the input file modification time as their timestamp. The command validates keys, namespaces, and timestamps, keeps the newest duplicate key, and refuses to overwrite an existing output unless `--force` is provided. The source file is never removed, and failed validation does not leave a partial output. Parse the resulting file and pass it to `importLocalData(records, true)` for one-transaction replacement; export the current data first so that the operation can be rolled back.

## Merge and failure guarantees

`importLocalData(records)` merges by the `(namespace, key)` pair. It updates the
existing row only if the backup is at least as recent, so importing the same file
again does not append duplicates or replace newer local values. `replace=true`
clears and restores in one transaction. Zod validates the envelope before any
write; a structured-clone or storage failure rolls back both the clear and all
subsequent writes. Take `exportLocalDataJson()` before replacement to retain a
separate rollback artifact.

Concurrent `setLocalValue` calls perform lookup and write in the same Dexie
transaction. If an old release already created duplicate rows, reads choose the
newest timestamp while exports preserve all existing rows for recovery. Explicit
replacement deduplicates the supplied backup; no background job deletes old rows.

Legacy localStorage migration snapshots the source, writes missing keys and its
completion marker atomically, and does not overwrite records already in Dexie.
A failed migration leaves no partial rows or completion marker and can be retried.
Original localStorage values are retained. `scripts/playwright-storage-smoke.sh`
verifies these behaviors in Chromium's real IndexedDB, including simulated storage
failure, export/restore and database reopen. SQLite and native stores need their
own platform validation; this browser test does not establish those results.
