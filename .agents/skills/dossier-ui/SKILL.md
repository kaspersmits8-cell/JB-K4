---
name: dossier-ui
description: Screens, layout, components, visual states and copy for the Trust Dossier. Covers the login, the case inbox and the case dossier. The dossier holds context confirmation, the key finding with its next step, findings with Supported/Indication/Conflicting/Insufficient states, the agreed-vs-processed comparison, a source drawer with highlighted quotes and not-applicable reasons, precedents, experts, timeline, what-if source exclusion, the client reply draft and the decision panel. Use this skill whenever you build or change pages or components in src/app or src/ui, touch user-facing copy, or plan the 3-minute demo flow.
---

# Dossier UI

## Why a dossier, not a chat
A chat hides where answers come from and makes Jan invent prompts under time pressure. The challenge asks to make trust "visible, explainable and useful". So the main surface is a case file that already holds the answer, the evidence, what does not apply, and what is still missing. Language features such as drafts live inside it.

## Screens
1. **`/login`**
2. **`/cases`** — inbox of open cases for the user's clients: client, employee, question type, received at, status.
   - Empty state when there is no data: explain `npm run data:check` and `npm run data:ingest`.
3. **`/cases/[id]`** — the dossier. Out of scope or unknown → the standard 404 page.

## Dossier layout (desktop first, ≥1280px; stack columns below 1024px)
**Header**
- The question as received (quoted), client, employee, disputed period, reported amounts with gross/net.
- AI-proposed fields carry a "Proposed" tag with Confirm/Edit.

**Key finding card** (full width)
- One sentence built from reason codes, e.g. "Payroll processed 70% for January; the approved change says 100% from 1 January."
- Next step with its owner role.
- An "N open items" link.

**Left column (~60%)**
- **Findings:** one row per playbook check with the question, state badge, value, "Based on" chips, and a "Doesn't count: N" link.
- **Comparison block:** agreed vs processed, side by side.
- **Derivation line:** "5,000 × 70% = 3,500 → explains the paid amount · gap 1,500".

**Right column (~40%): sources**
- Selecting a finding shows its evidence grouped as **Counts**, **Supports**, **Contradicts** and **Doesn't apply**.
- Each non-applicable source shows reason chips such as "Other period: Jul–Dec 2025", "No owner", "Other country: NL", "Known only after 1 Feb 2026", "Superseded by v3".
- Selecting a source opens a drawer:
  - for documents, the quote highlighted in context;
  - for records, a field table;
  - metadata: type, system or owner, version, status, validity, known_at, visibility;
  - a "same origin as REC-0004" note where set.

**Tabs below:** Precedents · Experts · Timeline · Reply draft · Decision.

## State visuals
- Badges always combine icon + label + colour, never colour alone:
  - **Supported:** green, check.
  - **Indication:** amber, half circle.
  - **Conflicting:** red, split arrows.
  - **Insufficient:** grey, question mark.
- Not-applicable sources are muted with a reason chip, never hidden.
- Reversed precedents get a red "Later reversed" tag.
- No percentages, gauges, star ratings or scores anywhere.

## Precedents and experts
- **Precedent cards:** root cause, anonymised summary, decided by, outcome, "Matches on …" and "Differs in …".
- **Expert cards:** name, role, the reasons as short phrases ("Owns the current correction procedure", "Resolved a similar confirmed case"), and the suggested question with a copy button.

## What-if mode
- Every source row has an "Exclude from analysis" toggle.
- While anything is excluded, show a sticky banner "What-if: 1 source excluded · Reset".
- Changed findings show "Supported → Indication" with a subtle highlight, and the next step updates.
- The state lives in the URL (`?exclude=REC-0002`) so the demo is reproducible. The server recomputes.

## Reply draft
- A list of sentences. Each sentence reveals its source chips on hover or focus.
- `uncertainty` sentences are styled distinctly.
- The draft is labelled "AI draft" or "Template" depending on its origin.
- Copy button; nothing is ever sent from the app.

## Decision panel
- Actions per role (enforced on the server): Send explanation · Request confirmation · Propose correction review · Approve correction (payroll lead only) · Mark executed · Confirm outcome.
- Separate status chips: Reply sent · Correction approved · Correction executed · Outcome confirmed.
- A rationale is required for every decision.
- The Timeline tab merges case events with decisions.

## Copy
- All strings live in `src/ui/copy.ts`: English now, with keys so NL/FR can follow.
- Reason codes map to sentences in one table.
- Plain, short, specific: "Doesn't apply: covers Jul–Dec 2025" beats "Low relevance".

## Style
- Tailwind; neutral greys, one accent colour, generous whitespace, system font stack.
- No SD Worx logo or brand assets.
- Visible keyboard focus, AA contrast, semantic HTML (tables for comparisons, buttons for actions).

## Demo path (optimise for this, in this order)
1. Inbox → open Piet's case → read the key finding.
2. Click "Agreed regime" → the approved change counts; the Nov email shows "Doesn't apply: other period".
3. Precedents: one confirmed, one "Later reversed".
4. Expert with reasons.
5. Exclude the approved change → the finding drops to Indication and the next step changes to "request confirmation" → Reset.
6. Reply draft with sources → record the decision.

Everything on this path must work with `LLM_PROVIDER=mock`.
