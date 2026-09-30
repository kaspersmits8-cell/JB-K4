# Codex prompt — Milestone 1.5: from report page to guided flow

Before pasting: replace `.agents/skills/dossier-ui/SKILL.md` in the repo with the new version from this package, commit it, and restart Codex. Then use `/plan`, paste everything below the line, review the plan, leave plan mode (Shift+Tab) and set the goal at the bottom.

---

User testing of milestone 1 failed on the UI. The case page is one long report: no input, no flow, engine jargon, raw IDs, and the same finding repeated in several places. It feels built for developers, not for Jan.

Rebuild the UI as the guided flow in the updated `.agents/skills/dossier-ui/SKILL.md`: **Inbox → Question → Answer (with tabs) → Respond.** Read that skill first. It supersedes the current layout. In the same pass, apply the Trustworx brand and the "sources, not verdicts" framing described there.

## Scope
- **In scope:** routes, pages, components, `src/ui/copy.ts`, brand tokens (CSS variables, Tailwind mapping, `next/font`), small read-only API or service additions the new screens need, and UI tests.
- **Also in scope:**
  - an optional `deadline` field (ISO date) on cases: add it to `docs/DATA_CONTRACT.md`, the zod schema and the checker, and show it in the inbox and context bar;
  - allow email and chat `from` / `to` to reference an employee id (E-…) as well as a person id, including contract, schema, checker and tests.
- **Out of scope:**
  - engine logic, playbook semantics, authorization rules, decision state machine;
  - real AI, search, the rule check;
  - anything in `data/`.

## Cut from the current UI (delete the components; don't hide them)
1. The single long case page, including the side-by-side "Findings / Sources" layout with everything expanded.
2. The separate "Agreed versus processed" table and the "Key finding" block. Both are replaced by the answer card; each fact appears once.
3. Findings for reference salary and paid salary as separate rows on the answer screen. They live only inside the calculation sentence and in the Sources tab.
4. The "Other evidence" / "Does not establish this finding" group.
5. "Exclude from analysis" on every row by default. It appears only when "Test this answer" is switched on, and is renamed "Remove from this test".
6. Raw IDs (REC-…, DOC-…, P-…, CASE-…) anywhere outside the source drawer.
7. Engine wording on screen: "Authoritative evidence agrees", "Supporting evidence", "Supported values differ", "Informal evidence contradicts the authoritative finding", snake_case root causes, "Open — Open", ISO dates, "Demo clock pinned", and the stray "Key finding · Template" label.
8. The "Open items" list as a separate section. Gaps appear only as "Check before you act" inside the answer card, with at most 3 items.
9. Duplicated metadata lines ("Disputed period … Reported amounts …") at the top. They become the one-line context bar.
10. Empty "Differs in" labels and empty groups ("Supports (0) — No evidence in this group"). Hide anything empty.

## Build, in this order (typecheck + tests + commit after each)
1. **Brand and copy foundation**
   - Palette tokens, IBM Plex via `next/font`, and badge components with the new labels (Backed / Unconfirmed / Conflicting / Missing).
   - Move every user-facing string into `copy.ts`: source type labels, reason chips, root causes and outcomes in words, date and amount formatting.
2. **Routes and stepper:** `/cases`, `/cases/[id]`, `/cases/[id]/answer`, `/cases/[id]/respond`. All state is in the URL (`ask`, `tab`, `exclude`), zod-validated; `ask` is at most 300 characters and rendered as text.
3. **Inbox as cards**, with deadline and status chips.
4. **Question step:** client message, attachment chips, context row, ask box prefilled from the case, suggested questions from the playbook checks, "Check with Trustworx", scope line.
5. **Answer step:**
   - "You asked", scan line (real counts), answer card with claim-level source chips and badges, `derived_from` phrasing, "Check before you act".
   - Tabs: Sources (collapsible per check; groups Counts / Contradicts / Doesn't apply), Past cases (max 3), People (max 3), Procedure ("This procedure says: …" + "Not used" collapsed).
   - Source drawer with serif text and highlighted quote; IDs in mono appear only here.
6. **Test this answer:** off by default; when on, toggles appear, plus the banner with Reset and "was → now" markers on changed items.
7. **Respond step:** reply draft, decision panel, collapsed case history.
8. **Clean-up and tests**
   - Delete dead components and styles from the old page.
   - Add `@playwright/test` as a dev dependency with one end-to-end test of the demo path from the skill, running on test fixtures with `LLM_PROVIDER=mock` and `DEMO_NOW` set.

## Acceptance criteria
- **Question step:** opening Piet's case lands here, with Melanie's message, attachments and a prefilled question. It does not jump straight to an analysis.
- **Answer page shows no raw IDs**, no snake_case, no ISO dates and no "Open — Open" (asserted in the e2e test by regex on the visible text, outside the drawer).
- **Each fact appears once.** Agreed 100% and processed 70% are stated once in the answer card, and once in their Sources sections.
- **Sources tab:** the contract counts; the amendment shows "Doesn't apply · Starts 1 Mar 2026"; the HR tool entry shows under Contradicts; the payslip shows "Copied from the January payroll input".
- **Past cases:** a similar confirmed case first, and a "Later reversed after a complaint" case second.
- **Test this answer:** with the switch on, removing the contract changes "Agreed regime" to Unconfirmed and updates the answer card; Reset restores it; the URL reproduces the state.
- **Procedure tab:** the procedure owner (Sarah) and "This procedure says: …"; the two other procedures sit under "Not used" with reasons.
- **Brand:** the Trustworx name, palette and Plex fonts are applied; state colours are used only for badges.
- **Access:** Femke cannot open Piet's case (404). The existing authorization and engine tests stay green.
- **Build:** typecheck, lint, unit tests, the Playwright test and the production build are all green.

## When you finish
Reply with:
1. Screenshots or a short description of each step.
2. What you deleted.
3. Any deviation from the skill, and why.
4. The exact commands to run the demo.

---

Goal to set after the plan (outside plan mode):

```
/goal Execute the approved Milestone 1.5 plan. Done = every acceptance criterion above passes, including the Playwright demo-path test, and typecheck, lint, unit tests and production build are green. Commit after each step. Never write to data/. Do not change engine logic or authorization. If the skill and the code conflict, follow the skill and report it.
```
