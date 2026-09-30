# Trust Dossier architecture

AI reads and writes, code judges.

One Next.js process, a local SQLite database, and a read-only file connector.
The pure engine will consume scoped repository inputs; it never queries the database.

Implementation follows the nine phases in CODEX_PROMPT_01.md with the approved revisions.
Node 24 is the local runtime. The database adapter isolates the SQLite driver.

Phase 1 verification: better-sqlite3 installed successfully on Windows with Node
24.13.0. Prepared statements, commit and rollback passed. No fallback was needed.
node:sqlite was also smoke-tested successfully as the approved fallback.
