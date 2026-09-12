# Local data migration

Existing localStorage and SQLite data remains readable through the legacy adapters. New persistence work must use a versioned schema and preserve an export-before-upgrade path. Users can export JSON, clear cached media, or clear all local data from Settings. Destructive migration is never automatic; an incompatible record is retained in the legacy store and reported locally.
