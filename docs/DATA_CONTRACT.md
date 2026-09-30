# Data contract — Trust Dossier

For: the teammate who authors the demo data, and Codex, which implements the loader and validator.
This file is the single source of truth. When code and this file disagree, change one of them on purpose and tell each other.

## 1. Golden rules

1. **Everything is fictional.** No real people, clients, brands or salaries.
2. **Missing metadata is information, not an error.** If nobody owns a document, write `owner: null`. The engine treats an ownerless document as non-authoritative, which is exactly the situation the SD Worx case describes. Never invent metadata just to make validation pass.
3. **Every fact has two times:** when it is or was true (`valid_from` / `valid_to`) and when SD Worx knew it (`known_at`).
4. **Amounts are numbers in EUR and always say gross or net.**
5. **Build only what a playbook check or a demo moment uses** (see §11). No badge, clock-in or team data unless a check needs it.
6. **Only the data author writes in `data/`.** Codex never does.

## 2. Folder layout

```
data/
├── clients.json
├── people.json
├── employees.json
├── records/      structured system data: one JSON object (or an array of objects) per file
├── documents/    procedures, policies, emails, chats: Markdown with YAML front matter
└── cases/        open cases and closed precedents: one JSON object per file
```

Shared, edited together: `config/vocabulary.json` (allowed values for types, attributes, topics, root causes...).
Owned by the code side: `config/playbooks/*.json` (which checks run, which sources are authoritative for which question).

## 3. Conventions

| Thing | Rule | Example |
|---|---|---|
| IDs | prefix + 4 digits, unique across the whole dataset | `CL-0001` `P-0001` `E-0001` `REC-0001` `DOC-0001` `CASE-0001` `TH-0001` |
| Dates | `YYYY-MM-DD` | `2026-01-01` |
| Timestamps | ISO 8601, UTC | `2026-02-01T09:15:00Z` |
| Open-ended validity | `null` | `"valid_to": null` |
| Countries | ISO 3166-1 alpha-2 | `BE`, `NL` |
| Email addresses | fictional, `@example.com` | `jan.devries@example.com` |
| Language of texts | any; mixing NL and EN is realistic and fine | |
| File names | free but readable | `DOC-0003-correction-procedure-v3.md`. The `id` field is the ID, not the file name |

## 4. `clients.json` — array

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id` | string | ✓ | `CL-0001` |
| `name` | string | ✓ | fictional name |
| `country` | ISO2 | ✓ | drives country applicability of documents |
| `joint_committee` | string | | e.g. `PC 200` |
| `consultant_ids` | person id[] | ✓ | SD Worx people who may open this client's cases. **This drives authorization.** |

## 5. `people.json` — array

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id` | string | ✓ | `P-0001` |
| `name` | string | ✓ | |
| `email` | string | ✓ | `@example.com` |
| `organisation` | string | ✓ | `SDWORX` or a client id (for client HR contacts) |
| `role` | enum | ✓ | `vocabulary.roles`: consultant, payroll_lead, expert, client_hr |
| `team` | string | | free text |
| `countries` | ISO2[] | | where this person has expertise or responsibility |
| `responsibilities` | topic[] | | `vocabulary.topics` this person owns; used for expert suggestions |
| `active` | boolean | ✓ | inactive people are never suggested |

## 6. `employees.json` — array (employees of clients, e.g. Piet)

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id` | string | ✓ | `E-0001` |
| `client_id` | string | ✓ | |
| `name` | string | ✓ | |
| `job_title` | string | | |
| `employee_category` | enum | ✓ | `white_collar` or `blue_collar` |
| `country` | ISO2 | ✓ | |

## 7. `records/` — structured system data

```json
{
  "id": "REC-0002",
  "type": "contract_change",
  "system": "HR administration",
  "client_id": "CL-0001",
  "employee_id": "E-0001",
  "valid_from": "2026-01-01",
  "valid_to": null,
  "known_at": "2025-12-12T10:30:00Z",
  "status": "approved",
  "approved_by": "P-0002",
  "visibility": "client_shareable",
  "derived_from": [],
  "facts": [{ "attribute": "work_regime_pct", "value": 100 }],
  "note": "Return to full-time from 1 January 2026"
}
```

| Field | Req | Meaning |
|---|---|---|
| `id` | ✓ | |
| `type` | ✓ | `vocabulary.record_types` |
| `system` | ✓ | name of the source system, free text ("HR administration", "Payroll engine") |
| `client_id` | ✓ | |
| `employee_id` | ✓ | must belong to `client_id` |
| `valid_from` | ✓ | for `payroll_input` / `payslip`: first day of the pay period |
| `valid_to` | ✓, nullable | for `payroll_input` / `payslip`: last day of the pay period |
| `known_at` | ✓ | when SD Worx had this record |
| `status` | ✓ | records use `approved`, `pending`, `rejected`, `processed` |
| `approved_by` | | person id; recommended when `approved` |
| `visibility` | ✓ | `internal` or `client_shareable` |
| `derived_from` | | ids of records this one was copied or computed from (a payslip is derived from a payroll_input). Prevents counting one origin twice |
| `facts` | ✓ | `[{ "attribute": <vocabulary.attributes key>, "value": number \| string \| boolean }]`. The unit comes from the vocabulary |
| `note` | | shown in the UI |

## 8. `documents/` — Markdown with YAML front matter

```markdown
---
id: DOC-0002
type: email
title: "RE: werkregime Piet Peeters"
owner: null
status: unverified
valid_from: null
valid_to: null
known_at: 2025-11-20T14:12:00Z
scope:
  countries: [BE]
  client_ids: [CL-0001]
  employee_ids: [E-0001]
topics: [work_regime]
visibility: internal
from: P-0010
to: [P-0001]
sent_at: 2025-11-20T14:12:00Z
thread_id: TH-0001
assertions:
  - subject: E-0001
    attribute: work_regime_pct
    value: 70
    valid_from: 2025-07-01
    valid_to: 2025-12-31
    quote: "werkt 70% tot en met 31 december 2025"
---
Hallo Jan, ... Piet Peeters werkt 70% tot en met 31 december 2025. ...
```

| Field | Req | Meaning |
|---|---|---|
| `id` | ✓ | |
| `type` | ✓ | `procedure`, `policy`, `email`, `chat_message`, `knowledge_note` |
| `title` | ✓ | for emails: the subject line |
| `owner` | ✓, nullable | person id, or `null` if nobody owns it |
| `version` | | string |
| `status` | ✓ | `approved`, `draft`, `unverified`, `superseded`. Emails and chats are usually `unverified` |
| `supersedes` | | id of the document this one replaces |
| `valid_from` / `valid_to` | ✓, nullable | for procedures and policies: when they apply. For emails and chats: `null` |
| `known_at` | ✓ | when it became available to SD Worx |
| `scope.countries` | ✓ | ISO2 list, or `["*"]` for all |
| `scope.client_ids` | ✓ | ids, or `["*"]` for all |
| `scope.employee_ids` | | for messages about specific employees |
| `topics` | ✓ | `vocabulary.topics` |
| `visibility` | ✓ | `internal` or `client_shareable` |
| `from`, `to` | emails/chats | sender and recipient ids: person (`P-…`) or employee (`E-…`); each must exist |
| `sent_at`, `thread_id` | emails/chats | ISO timestamp and thread id |
| `case_id` | | link to a case |
| `assertions` | | pinned facts the text states (below) |

### Pinned assertions

The app can extract facts from text with AI, but for everything the demo depends on, **pin** them, so the demo never depends on a live model.

- `subject`: employee id.
- `attribute`: a key from `vocabulary.attributes`.
- `value`: the value the text states.
- `valid_from` / `valid_to`: the period **the text says** the fact holds, not when the message was sent.
- `quote`: must appear **exactly** (character for character) in the body. The validator checks this and the UI highlights it.

## 9. `cases/` — open cases and precedents

```json
{
  "id": "CASE-0001",
  "status": "open",
  "question_type": "payslip_dispute",
  "client_id": "CL-0001",
  "employee_id": "E-0001",
  "channel": "ticket",
  "opened_at": "2026-02-01T09:15:00Z",
  "reporter_id": "P-0010",
  "assigned_to": "P-0001",
  "language": "nl",
  "question_text": "...",
  "disputed_period": { "from": "2026-01-01", "to": "2026-01-31" },
  "reported": { "expected_amount": 5000, "received_amount": 3500, "currency": "EUR", "basis": "gross" },
  "topics": ["payslip", "work_regime"],
  "timeline": [
    { "at": "2026-02-01T09:15:00Z", "type": "received", "actor_id": "P-0010", "description": "Question received via ticket", "source_ids": [] }
  ]
}
```

| Field | Req | Meaning |
|---|---|---|
| `id` | ✓ | |
| `status` | ✓ | `open`, `closed`, `reopened` |
| `question_type` | ✓ | `vocabulary.question_types` |
| `client_id`, `employee_id` | ✓ | |
| `channel` | ✓ | `ticket`, `email`, `phone` |
| `opened_at` | ✓ | |
| `deadline` | | Optional ISO date (`YYYY-MM-DD`), e.g. `2026-02-18`; invalid calendar dates are errors |
| `reporter_id` | ✓ | the client HR person |
| `assigned_to` | ✓ for open | consultant id |
| `language` | | `nl`, `fr`, `en`: language for the reply |
| `question_text` | ✓ | as received |
| `disputed_period` | ✓ | `{ from, to }` |
| `reported` | | `expected_amount`, `received_amount`, `currency`, `basis` (`gross`, `net` or `unknown`; `unknown` makes the UI ask Jan to confirm) |
| `topics` | ✓ | used to match precedents |
| `timeline` | | events `{ at, type, actor_id, description, source_ids }`, type from `vocabulary.timeline_event_types` |

**Extra fields for closed or reopened cases (precedents):**

| Field | Req | Meaning |
|---|---|---|
| `resolution.root_cause` | ✓ | `vocabulary.root_causes` |
| `resolution.summary` | ✓ | **anonymised**: no employee names, no amounts. Consultants of other clients may see this |
| `resolution.decided_by` | ✓ | person id |
| `resolution.decided_at` | ✓ | |
| `resolution.source_ids` | | documents or records used |
| `outcome.status` | ✓ | `pending`, `confirmed`, `reversed`, `complaint_reopened` |
| `outcome.confirmed_at` | | |
| `outcome.note` | | what happened afterwards |

## 10. What `npm run data:check` enforces

**Errors** (exit code 1):
- unparseable JSON or YAML;
- missing required fields, wrong types, values outside the vocabulary;
- duplicate ids anywhere in the dataset;
- references to ids that don't exist (client, employee, person, `supersedes`, `derived_from`, `source_ids`, `case_id`);
- a record whose employee belongs to another client;
- `valid_from` after `valid_to`;
- a pinned assertion whose `quote` is not literally in the body, or whose `subject` is not an employee in the document's scope.

**Warnings** (exit code 0; read them, some are intended):
- a document without an owner;
- an approved document without a version;
- a precedent summary that contains an employee name or an amount;
- an open case without `assigned_to`;
- `reported.basis` is `unknown`.

## 11. Demo dataset — required ingredients

| # | Ingredient | Demo moment it enables |
|---|---|---|
| 1 | `CL-0001` (BE) with Jan as consultant; `CL-0002` (NL) with another consultant | Authorization: Jan must not see CL-0002 |
| 2 | Piet (`E-0001`, CL-0001): contract_change 70% valid 2025-07-01 → 2025-12-31 (approved); contract_change 100% valid from 2026-01-01 (approved, known in Dec 2025); hr_master_data full-time reference 5000 gross; payroll_input Jan 2026 regime 70% (processed); payslip Jan 2026 regime 70% and base salary paid 3500 (processed, `derived_from` the payroll_input) | Main finding: agreed 100 vs processed 70, and 5000 × 70% = 3500 explains the paid amount |
| 3 | Email Nov 2025 stating "70% until 31 December" (pinned assertion) | "Authentic and correct at the time, but doesn't apply to January" |
| 4 | Email or chat Dec 2025 saying Piet goes back to full-time in January (unverified, pinned assertion) | What-if: exclude the approved change → only this remains → Indication → "request confirmation" |
| 5 | Correction procedure BE: v3 approved with owner; v2 superseded; a copy without owner; an NL version | Current procedure selected; the others shown with reasons (superseded, no owner, other country) |
| 6 | Precedent A: `work_regime_not_updated`, outcome `confirmed`, decided by an expert | Relevant precedent + expert suggestion |
| 7 | Precedent B: same root cause, outcome `complaint_reopened` or `reversed` | Outcome-aware trust: flagged "later reversed" |
| 8 | Precedent C: `absence_miscoded` | Similar wording, different cause, ranked lower |
| 9 | Second open case in CL-0001 (`E-0002`): 70% agreed and processed, payslip correct | Variant "processed correctly" → explain to client |
| 10 | One open case in CL-0002 | Invisible to Jan |
| 11 | People: Jan (consultant), a payroll lead, an expert who owns the procedure, the CL-0002 consultant, Melanie (client_hr) | Roles, experts, four-eyes approval |

Don't build: team data, badge or clock-in data, real payroll calculations, more cases than above.

## 12. Workflow for adding or changing data

1. Add or edit files in `data/`.
2. Run `npm run data:check`. Fix errors; read the warnings.
3. Run `npm run data:ingest`.
4. Refresh the app. No code change is needed.
5. Commit `data/` in its own commit (`data: ...`).

Need a new attribute, topic or root cause? Add it to `config/vocabulary.json` in the same commit and tell the code side if a playbook check should use it.
