# AGENTS.md — Trust Dossier

Working name: **Trust Dossier** (rename freely). Built for the Tectonic Hackathon, SD Worx track:
"How might we turn fragmented organisational knowledge into a trusted shared resource?"

## Product in one paragraph
A case workspace for an SD Worx payroll consultant (persona: Jan). A client HR manager (Melanie) forwards a question from an employee (Piet). First playbook: a payslip dispute. For one case, the app gathers the relevant records, documents and past cases and shows per finding whether it is **Supported**, an **Indication**, **Conflicting** or **Insufficient**, and why. It shows which sources do *not* apply and why (other period, other country, no owner, superseded, not yet known), suggests a next step and the right expert, and drafts a reply that only uses evidence the client may see. Jan decides; the app records the decision and its outcome.

## The one principle: AI reads and writes, code judges
- LLMs turn unstructured text into structured assertions (with an exact quote), propose missing case fields, and phrase explanations and drafts.
- Deterministic TypeScript decides applicability, authority, conflicts, finding states, comparisons, next steps, and precedent and expert ranking.

Why: SD Worx already has an AI assistant their people don't trust, and the challenge asks for trust that is "visible, explainable and useful". Every state on screen must be traceable to a rule and a source.

## Stack
Next.js (App Router) + TypeScript strict · Tailwind CSS · SQLite via better-sqlite3 · zod · gray-matter · iron-session · bcryptjs · Vitest.
One app, one process, one database file. Node 20+. Ask before adding other dependencies.

## Commands
| Command | What |
|---|---|
| `npm run dev` | start the app |
| `npm run data:check` | validate `$DATA_DIR` (default `./data`) against `docs/DATA_CONTRACT.md`; no writes |
| `npm run data:ingest` | validate, then rebuild the data tables in SQLite (keeps users, decisions, LLM cache) |
| `npm run user:create -- --email <e> --person <P-id> --role <role>` | create a login; password is prompted |
| `npm test` · `npm run typecheck` · `npm run lint` | quality gates |

## Layout
```
src/
  app/        Next.js routes and route handlers. Thin: session → validate input → call a service.
  server/     auth, session, scoped repository (the ONLY data access), services
  data/       zod schemas for the contract, connectors, checker, ingest pipeline
  engine/     pure trust engine: no I/O, no LLM, no clock (asOf is a parameter)
  ai/         LLM provider interface, mock + real providers, tasks, prompt versions
  ui/         components + copy.ts (all user-facing strings)
config/       vocabulary.json (shared with the data author), playbooks/*.json
docs/         DATA_CONTRACT.md, data-templates/, ARCHITECTURE.md
data/         authored by a teammate. Never write here.
tests/        unit tests + fixtures (fixtures derived from docs/data-templates)
```

## Non-negotiables
1. Never create, edit or delete anything in `data/` (or `$DATA_DIR`). Tests use `tests/fixtures/` only.
2. All client data is read through `src/server/repo` with the current user. Out of scope behaves as "not found".
3. `src/engine` is pure: no LLM calls, no network, no clock, no randomness.
4. Every LLM output is zod-validated and every cited id must be one that was sent. Invalid output is dropped or replaced by a template.
5. The whole app works with `LLM_PROVIDER=mock` and no network.
6. No secrets in git. `.env.example` documents every variable.
7. Never show trust as a percentage or score. States plus reasons only.

## Skills: read the matching one before starting a task
| Skill | Use when |
|---|---|
| `.agents/skills/data-contract/` | loading, validating, ingesting data; schemas; vocabulary; fixtures |
| `.agents/skills/trust-engine/` | anything in `src/engine` or `config/playbooks`; states, applicability, precedents, experts, what-if |
| `.agents/skills/ai-integration/` | anything in `src/ai`; prompts, extraction, drafting, citations, search |
| `.agents/skills/security-authz/` | auth, sessions, route handlers, repo, roles, approvals; anything the Aikido audit looks at |
| `.agents/skills/dossier-ui/` | pages, components, copy, layout, the demo path |

## Done means
typecheck, lint and tests green · README and `docs/ARCHITECTURE.md` updated when structure or commands change · a short summary of what changed, what is stubbed, and open questions for the team.
