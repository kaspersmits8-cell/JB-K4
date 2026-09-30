---
name: data-contract
description: How the Trust Dossier reads, validates and ingests the teammate-authored dataset in data/ according to docs/DATA_CONTRACT.md and config/vocabulary.json. The dataset holds clients, people, employees, records, Markdown documents with YAML front matter, and cases. The skill also covers how test fixtures are made and how the SQLite data tables look. Use this skill whenever you touch src/data, the data:check or data:ingest scripts, zod schemas for data, SQLite data tables, the vocabulary, fixtures, or connectors. Also use it when a feature needs a field that may not exist in the data yet, and always before creating any file that looks like data.
---

# Data contract implementation

## Why
The dataset is written by a teammate in parallel with the code, and the contract is the interface between the two. If the code quietly tolerates or invents data, the demo breaks at the worst possible moment. If validation messages are cryptic, the data author loses hours. So the checker is strict, loud and friendly.

## Rules
- **The spec is `docs/DATA_CONTRACT.md` plus `config/vocabulary.json`.** Mirror them in zod schemas in `src/data/schemas.ts`; do not redesign them.
- **Need a field that isn't in the contract?** Don't add it silently. Propose the contract change in your end-of-task summary.
- **Never write to `data/` (or `$DATA_DIR`), and never generate demo content.** If data is missing, the app shows an empty state explaining how to add it.
- **Fixtures** live in `tests/fixtures/<scenario>/`, with the same folder structure as `data/`. Derive them from `docs/data-templates/` and keep them as small as the test allows. They are not demo data; don't polish them.
- `DATA_DIR` (default `./data`) selects the dataset; `DB_PATH` (default `./.local/trust.db`) the database.

## `npm run data:check`
Loads everything from `$DATA_DIR`, validates it, prints a report and exits with 1 on errors. It never writes to the DB.

**Errors:**
- Parse errors, with file and line where available.
- Schema violations: field path, expected, got.
- Duplicate ids across files.
- Dangling references: client, employee, person, `supersedes`, `derived_from`, `source_ids`, `case_id`.
- A record's employee belongs to a different client.
- `valid_from` after `valid_to`.
- Unknown vocabulary values.
- A pinned assertion `quote` that is not literally in the body (compare against the body, not the front matter), or whose `subject` is not an employee in the document's scope.

**Warnings:**
- A document without an owner (often intended).
- An approved document without a version.
- A precedent `resolution.summary` that contains an employee name or a number followed by €/EUR.
- An open case without `assigned_to`.
- `reported.basis` is `unknown`.

**Output format:** grouped per file, one line per issue, each with a fix hint, then counts. Example:

```
documents/DOC-0002-mail.md  error  assertions[0].quote not found in body. Copy the exact text (check quotes and spaces).
records/REC-0007.json       error  employee_id E-0003 belongs to CL-0002, record says CL-0001.
documents/DOC-0005.md       warn   owner is null. Fine if intended: this document can never be authoritative.
3 errors, 1 warning in 24 files
```

## `npm run data:ingest`
1. Run the checker; abort on errors.
2. In **one transaction**, rebuild the data tables: clients, people, employees, sources, fragments, assertions, cases, case_events. Keep users, decisions, case_status_events and llm_cache.
3. Normalise records and documents into `sources` (`kind` = record | document), with typed metadata columns plus `meta_json`.
4. **Fragments:**
   - Document bodies are split on headings and blank lines, with stable ids `DOC-0002#f3` and character offsets.
   - Each record fact gets a pseudo-fragment `REC-0002#facts[0]`.
5. **Assertions:**
   - Record facts → origin `structured`.
   - Pinned front-matter assertions → origin `declared`, linked to the fragment containing the quote.
   - Milestone 2: AI-extracted assertions → origin `ai_extracted`, only for documents without pinned assertions, through `llm_cache`.
6. Print a summary: counts per type, warnings.

Ingest must be idempotent and independent of file order.

## Database (SQLite, better-sqlite3)
- Prepared statements only.
- Migrations are plain SQL files in `src/data/migrations/`, applied in order at startup.
- Tables: clients, people, employees, sources, fragments, assertions, cases, case_events, users, decisions, case_status_events, llm_cache.
- Arrays and objects go in JSON text columns.
- Indexes on `assertions(subject_id, attribute)`, `sources(client_id)`, `fragments(source_id)`, `cases(client_id, status)`.

## Connector seam
`src/data/connectors/types.ts` defines a connector as something that yields canonical `SourceInput` objects in the contract's shape.
- `FileConnector` reads `$DATA_DIR`.
- Future connectors (ticketing system, document platform, payroll exports, chat) implement the same interface.
- The engine never knows where a source came from beyond its metadata.

Keep this seam small and real. It is the scalability story in the pitch.
