# Installing the demo dataset

Everything in this package is fictional. The folders mirror the repository root.

## 1. Copy into the repo (PowerShell, from the repo root)

```powershell
Expand-Archive ..\trustworx-data-v1.zip -DestinationPath ..\trustworx-data-v1-unzipped
$src = "..\trustworx-data-v1-unzipped\trustworx-data-v1"
New-Item -ItemType Directory -Force data, research, tests, docs\data | Out-Null
Copy-Item -Recurse -Force "$src\data\*"     .\data
Copy-Item -Recurse -Force "$src\research\*" .\research
Copy-Item -Force "$src\tests\answer_key.json" .\tests
Copy-Item -Force "$src\docs\data\*" .\docs\data
```

If `data/` already holds an earlier version of this dataset, empty it first (`Remove-Item -Recurse -Force .\data\*`), otherwise old files stay behind.

This adds `data/`, `research/`, `tests/answer_key.json` and `docs/data/`. Nothing else in the repo is touched.

## 2. Pin the demo clock

In `.env.local`:

```
DEMO_NOW=2026-02-03T12:00:00Z
```

Why this value: Melanie's ticket and its attachments (the amendment, the emails) become known to SD Worx on 2 February 2026 at 08:14 UTC, and the second client's case opens on 3 February at 10:00 UTC. An earlier clock makes that evidence "not yet known".

## 3. Validate and load

```powershell
npm run data:check
npm run data:ingest
```

Expected from `data:check`: 0 errors and 6 warnings, all "document without an owner" (D2, T1 and the four emails). These are intended.

## 4. Create logins (only after ingest)

```powershell
npm run user:create -- --email jan@example.com   --person P-0001 --role consultant
npm run user:create -- --email lucas@example.com --person P-0005 --role payroll_lead
npm run user:create -- --email femke@example.com --person P-0006 --role consultant
```

| Person | Role in the demo |
|---|---|
| Jan (P-0001) | Demo user, consultant for Stride Sports |
| Lucas (P-0005) | Payroll lead: approves corrections |
| Femke (P-0006) | NL consultant: proves Jan can't see her client |

## 5. Run

```powershell
npm run dev
```

Log in as Jan and open CASE-0001.

## 6. What you should see

`tests/answer_key.json` lists every expected finding, with `milestone1_expectation` for what the engine should return.

| Part of the dossier | Expected |
|---|---|
| Agreed regime, January | Supported, 100% (REC-0001). REC-0002 and DOC-0006: doesn't apply, other period. REC-0003: contradicts |
| Processed regime | Supported, 70% (REC-0004). REC-0005 marked same origin |
| Calculation | 5,000 × 70% = 3,500 explains the payslip; gap 1,500 |
| Procedure | DOC-0001 selected. DOC-0002: superseded, no owner. DOC-0003: other country |
| Past cases | CASE-0002 first (confirmed). CASE-0003 flagged later reversed |
| Experts | Sarah (P-0002) and Ines (P-0003), then Lucas (P-0005) |
| Logged in as Femke | Only CASE-0010. CASE-0001 returns 404 |

## Installation compatibility

The original archive uses `from: null` in Piet's emails (DOC-0005 and DOC-0007).
The installed copies omit this optional field to satisfy the existing schema,
which accepts person ids when it is present. No sender id was invented, and the
email bodies and assertions are unchanged. Reinstalling the original archive
requires the same adjustment before validation. Employee ids in `from`/`to`
remain a possible future contract extension.

## Later changes (not needed for milestone 1)

- When the playbook's root cause becomes `effective_date_error` (or `regime_change_wrong_effective_date`), change `resolution.root_cause` in CASE-0002 and CASE-0003 to the same value.
- When the rule check exists, add `rule_assertions` to DOC-0001, DOC-0002, DOC-0003 and DOC-0004.
