# Codex prompt — Milestone 1: architecture, deterministic engine, simple UI

Paste everything below the line into Codex, started from the repository root.

---

You are building the first working version of **Trust Dossier**, a hackathon prototype for the SD Worx challenge: "turn fragmented organisational knowledge into a trusted shared resource".

Before writing any code, read:
- `AGENTS.md`
- every skill in `.agents/skills/`: data-contract, trust-engine, security-authz, dossier-ui, ai-integration
- `docs/DATA_CONTRACT.md`
- `config/vocabulary.json`
- `config/playbooks/payslip_dispute.json`

These are the spec. If anything in them is contradictory or unbuildable, tell me in your final summary instead of guessing. Before phase 1, write a short plan (max 15 lines) listing the files you will create per phase.

## Goal of this milestone
1. A consultant logs in and sees the open cases of their own clients.
2. Opening a case shows a dossier with:
   - findings with states and reasons;
   - which sources apply and which don't, with reasons;
   - the next step and the current procedure;
   - precedents and experts;
   - a what-if toggle per source;
   - a template-based reply draft;
   - a decision panel.
3. Everything is computed by the deterministic engine from the data in `$DATA_DIR`. AI runs only through the mock provider.

## Out of scope now
- Real LLM calls, AI extraction, embeddings or keyword search.
- Chat, deployment, visual polish beyond the dossier-ui skill.
- **Any demo data.**

## Data: important
- The demo data in `data/` is being written by my teammate in parallel and may not exist yet. **Do not create, modify or delete anything in `data/`.**
- For tests, create minimal fixtures in `tests/fixtures/<scenario>/`, derived from `docs/data-templates/`. Add only what each test scenario from the trust-engine skill needs; one shared base plus small per-scenario additions is fine.
- `DATA_DIR` selects the dataset (default `./data`). During development you can point it at a fixture folder.
- When `DATA_DIR` is empty or missing, the app shows an empty state explaining `data:check` and `data:ingest`.

## Build in this order. After each phase: typecheck + tests, then commit (`phase N: …`)
1. **Scaffold**
   - Next.js App Router, TypeScript strict, Tailwind, ESLint, Vitest.
   - `.env.example` with `SESSION_SECRET`, `DATA_DIR`, `DB_PATH`, `LLM_PROVIDER=mock`, `LLM_MODEL`, the GCP/Gemini variables (commented), and `DEMO_NOW` (optional ISO timestamp that pins the app clock for the demo).
   - The folder layout from AGENTS.md and a `docs/ARCHITECTURE.md` skeleton.
2. **Data layer**
   - zod schemas mirroring the contract; `FileConnector`.
   - `npm run data:check` with the report format from the data-contract skill.
   - SQLite migrations.
   - `npm run data:ingest` with structured and declared assertions only.
   - `DATA_DIR=docs/data-templates npm run data:check` must pass.
3. **Auth + scoped repo**
   - `users` table and `npm run user:create` (password prompted).
   - iron-session login and logout.
   - Repo functions take `user` first; out of scope returns null (→ 404).
   - Anonymised precedents across clients.
4. **Engine**
   - `src/engine/types.ts` (Analysis), applicability, classification, states, comparisons, `regimeExplainsPaidAmount`, procedures, next step, gaps, precedents, experts, `diffAnalyses`.
   - Pure functions.
   - Tests for every scenario in the trust-engine skill, plus the determinism test.
5. **Services + API** (zod on every input)
   - `GET /api/cases`
   - `GET /api/cases/[id]/analysis?exclude=ID,ID` with `asOf` = `DEMO_NOW` or now
   - `GET /api/sources/[id]`
   - `POST /api/cases/[id]/decisions`, backed by the role-checked state machine from the security skill
6. **AI seam**
   - `LLMProvider` interface and `MockProvider`.
   - Tasks `draftExplanation`, `draftClientReply` and `draftExpertQuestion`, template-based, with citation validation.
   - The client-reply input is filtered on the server by visibility and state.
7. **UI** per the dossier-ui skill
   - `/login`, `/cases`, and `/cases/[id]` with: header, key finding, findings, comparison, sources drawer with reason chips and highlighted quotes, tabs (Precedents / Experts / Timeline / Reply draft / Decision), and what-if toggles with the diff banner through `?exclude=`.
8. **Hardening**
   - Security headers, login rate limit, error boundaries without stack traces.
   - All required tests from the security-authz skill.
9. **Docs**
   - README: setup, env, `user:create`, how the data author adds data (`data:check` → `data:ingest` → refresh), tests.
   - `docs/ARCHITECTURE.md`: a Mermaid diagram, the principle "AI reads and writes, code judges", and the connector seam.

If you run short on budget, finish phases 1–5 and a minimal phase 7 (inbox + findings + sources + what-if) before anything else.

## Acceptance criteria
- `data:check` on `docs/data-templates` passes. On a deliberately broken fixture it prints clear, per-file errors.
- On the main-case fixture, the dossier shows:
  - agreed regime 100 **Supported** and processed regime 70 **Supported** → mismatch;
  - next step "correction review" with the current BE procedure;
  - the Nov 2025 email under "Doesn't apply — other period";
  - the derivation 5,000 × 70% = 3,500 with a gap of 1,500.
- Excluding the approved contract change:
  - flips the agreed regime to **Indication**;
  - changes the next step to "request confirmation";
  - shows the diff banner; Reset restores everything.
- A consultant cannot open another client's case (404) and sees only anonymised foreign precedents.
- A consultant cannot approve a correction; a payroll lead cannot approve their own proposal.
- With `LLM_PROVIDER=mock` there are no network calls, and nothing is written under `data/`.
- typecheck, lint and tests are green.

## When you finish, reply with
1. What you built, per phase.
2. What is stubbed or skipped.
3. Deviations from the skills, and why.
4. Questions or contract changes for the data author.
5. The exact commands to run the demo locally, from a fresh clone.
