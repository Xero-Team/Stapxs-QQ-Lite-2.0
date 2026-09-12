# Local data migration

Existing localStorage and SQLite data remains readable through the legacy adapters. New persistence work must use a versioned schema and preserve an export-before-upgrade path. Users can export JSON, clear cached media, or clear all local data from Settings. Destructive migration is never automatic; an incompatible record is retained in the legacy store and reported locally. Diagnostic tooling can restore a validated export with `importLocalData(JSON.parse(json), true)`; replacement runs in one Dexie transaction and keeps the newest value for duplicate keys.

## Standalone migration command

When a diagnostic or release environment cannot access browser IndexedDB, convert a JSON export to the record array accepted by `importLocalData`:

```bash
yarn data:migrate --input legacy.json --output xero-local-data.json
```

The input may be an `exportLocalDataJson()` array or a legacy key/value object. Legacy objects are placed in the `legacy-localstorage` namespace and use the input file modification time as their timestamp. The command validates keys, namespaces, and timestamps, keeps the newest duplicate key, and refuses to overwrite an existing output unless `--force` is provided. The source file is never removed, and failed validation does not leave a partial output. Parse the resulting file and pass it to `importLocalData(records, true)` for one-transaction replacement; export the current data first so that the operation can be rolled back.
