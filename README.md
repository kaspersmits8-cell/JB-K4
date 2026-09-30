# Trustworx

Trustworx is a case workspace for SD Worx payroll consultants. It brings scattered
payroll records, contracts, emails, procedures and past cases together so a
consultant can explain a payslip dispute, see what still needs checking, and
prepare a reply backed by sources.

Built for the Tectonic Hackathon, SD Worx track: “How might we turn fragmented
organisational knowledge into a trusted shared resource?”

## The three personas

| Persona | Role in the story | What they need |
| --- | --- | --- |
| **Piet — the employee** | Notices that his payslip is lower than expected and raises the issue with HR. | A clear explanation of what happened and confirmation that any necessary correction has been handled. |
| **Melanie — the client's HR manager** | Forwards Piet's question and supporting documents to SD Worx. She is the link between the employee and the payroll consultant. | An understandable, evidence-backed answer she can share with Piet, plus clarity on any missing information or next steps. |
| **Jan — the SD Worx payroll consultant** | Investigates the case in Trustworx, reviews the evidence, prepares a response and records his decision. | One place to check which sources apply, resolve conflicting information and find the relevant procedure or expert. |

The prototype is Jan's workspace. Melanie and Piet are participants in the case;
they do not have separate HR or employee portals in this version.

## What the app does

The first supported scenario is a payslip dispute. In the demo, Piet received
€3,500 gross instead of the expected €5,000. Jan follows three steps:

1. **Question:** Open the case from the inbox, read Melanie's message and
   attachments, review the employee and payroll period, and choose what to check.
2. **Answer:** Compare the agreed working percentage with the percentage used
   in payroll, trace the salary calculation, and inspect the sources behind each
   finding. Explore relevant past cases, people and procedures. Use **Test this
   answer** to temporarily remove a source and see how the findings change.
3. **Respond:** Review and copy a reply draft that uses only evidence the client
   may see, then record a decision and its rationale. Track correction approvals
   and outcomes in the case history.

Each finding has a state and an explanation: **Backed** (Supported),
**Unconfirmed** (Indication), **Conflicting**, or **Missing** (Insufficient).
Trustworx also explains why a source does not apply—for example, it concerns
another period or country, has been replaced, or was not yet known at the time
of the analysis. Trust is shown through these reasons and source references.

The design principle is **AI reads and writes; code judges**. Deterministic
TypeScript rules decide which evidence applies and how findings are classified.
Jan reviews the evidence and makes the decision. The current prototype uses
mock/template drafts and a fixed set of payslip checks; free-text questions do
not yet trigger AI interpretation. Copying a reply or recording an action does
not send an email, change payroll or make a payment.

## Development overview

Next.js App Router, TypeScript, SQLite, and deterministic evidence analysis.

Requires Node 24.13+ (24.x) and npm. Run `npm install`, then `npm run db:verify`.
`npm run dev` starts the app; `npm test`, `npm run typecheck`, and `npm run lint` run checks.

Milestone 1 implements the deterministic engine, scoped case workspace, and mock
drafts. Never write application-generated content into `data/` or `DATA_DIR`.

The palette lives in `src/app/globals.css`, including Tailwind v4's `@theme inline`
configuration. Use its named colour utilities (for example `bg-paper`, `text-ink`,
`border-line`, and `ring-indigo`). Indigo is the interaction accent; state colours
are reserved for states and highlighter for source quotes.

Typography uses IBM Plex Sans (400/500) for UI, IBM Plex Serif (400 normal/italic)
for source text in the evidence drawer, and IBM Plex Mono (400) for identifiers.
`next/font/google` loads latin and latin-ext; the fonts are self-hosted after the
build-time download. Tailwind maps `--font-sans`, `--font-serif`, and `--font-mono`
in `globals.css`. Body text is 14–16px, headings at most 20px, and numbers use
tabular figures.

The supplied Trustworx logo is preserved in `public/trustworx.svg` and displayed
by `src/ui/Logo.tsx` on the sign-in screen and case headers.

For a local UI preview without a dataset or provisioned account, set
`LOCAL_DEMO_LOGIN=true` in `.env.local`, run `npm run dev`, and sign in with
username `1` and password `1`. This development-only identity opens the empty
inbox and has no client data access. Disable the flag to invalidate its sessions.
Use `npm run user:create` for an account linked to an ingested person.

The supplied fictional v1 dataset is installed in `data/`. Run `npm run data:check`
and `npm run data:ingest` after authored updates. See `docs/data/INSTALL.md` for
the demo clock, account provisioning, and two email metadata compatibility fixes.
Supporting research lives in `research/`; `tests/answer_key.json` is a reference
for expected findings, not an automated test.

## Setup from a fresh clone (PowerShell)

```powershell
git clone https://github.com/kaspersmits8-cell/JB-K4.git
cd JB-K4
npm ci
npm run db:verify
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the generated value after `SESSION_SECRET=` in `.env.local`. Keep existing
local secrets when updating the file. No AI API key is needed. The app refuses
to start with an invalid secret, clock, provider, or database configuration.

Use the teammate-authored dataset by leaving `DATA_DIR=./data`, or use the
acceptance fixture in a separate database:

```powershell
$env:DATA_DIR = 'tests/fixtures/main'
$env:DB_PATH = './.local/fixture.db'
$env:DEMO_NOW = '2026-02-01T09:15:00Z'
npm run data:check
npm run data:ingest
npm run user:create -- --email jan@example.com --person P-0001 --role consultant
npm run dev
```

Enter and repeat your own password when prompted (input stays hidden), then open
http://localhost:3000 and sign in. Both frontend and backend run in this one
process. Stop with Ctrl+C. For another terminal, set the same variables again,
or put them in `.env.local`. `1` / `1` is only an empty preview; it never receives
access to the fixture or authored dataset.

For correction approval, create a separate account with `--person P-0002 --role
payroll_lead`. A second lead, P-0005, exists in the acceptance fixture. These IDs
belong to the fixture; check `people.json` for the authored dataset. Consultants
and leads can propose, execute and confirm; only a different payroll lead can
approve. Every transition requires a rationale. Recording “Send explanation”
only records the action; no message or payment is sent.

## Environment

| Variable | Meaning |
| --- | --- |
| `SESSION_SECRET` | Required, at least 32 characters; private session encryption key. |
| `DATA_DIR` | Read-only input directory; defaults to `./data`. |
| `DB_PATH` | SQLite file; defaults to `./.local/trust.db`; must be outside both protected data directories. |
| `DEMO_NOW` | Optional ISO timestamp used as the `asOf` of every analysis; shown in the dossier header. Decision audit timestamps always use real server time. |
| `LLM_PROVIDER` | `mock` only in this milestone. |
| `LLM_MODEL` | Reserved; mock does not need it. |
| `LOCAL_DEMO_LOGIN` | Opt-in empty preview login in development only; defaults off. |

The commented Gemini/GCP and legacy OpenRouter variables in `.env.example` are
unused. Never expose credentials with `NEXT_PUBLIC_`. `.env.local`, databases,
and build output are ignored by Git.

## Data author workflow

Maintain the contract in `docs/DATA_CONTRACT.md` and vocabulary in `config/`.
After authored changes, run `npm run data:check`, fix its per-file errors, then
`npm run data:ingest` and refresh the browser. Warnings do not prevent ingest.
Failed validation or insertion leaves the existing imported data intact.
Successful ingest replaces imported tables atomically and keeps users,
decisions, correction status events and the LLM cache.

Removing a person used by an existing login produces an ingest warning. That
account immediately loses access, including through an existing session, until
the person is restored with an active matching role. Review warning IDs rather
than deleting account history. Missing/empty data shows setup guidance.

## Verification and local production

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run start
```

Stop the development server before starting production on the same port. To
test another port use `npm run start -- --port 3003`. Production sessions use
secure cookies; deployed instances require HTTPS. Build-time font downloads
need network access on the first build; the mock AI and runtime fonts use no
external services. Use a persistent writable disk for SQLite in a single Node
process. Deployment is outside this milestone.

The templates validate with `DATA_DIR=docs/data-templates`. The deliberately
broken fixture `tests/fixtures/broken` must fail with file/field errors.
`tests/fixtures/main` covers supported 100% vs 70%, the EUR 1,500 derivation gap,
old email exclusion, confirmed/reversed precedents and the what-if downgrade.

Real LLMs, extraction, search and embeddings are not implemented. Aikido audit
and deployment remain team follow-ups. See `docs/ARCHITECTURE.md` for the seams
and `docs/MILESTONE_1_VERIFICATION.md` for the verification record.
