---
name: dossier-ui
description: The Trustworx user interface. A guided flow in which Jan, an SD Worx payroll consultant, starts from a client question, asks Trustworx what to check, reads what the sources show, digs deeper in tabs, and prepares a reply. Covers routes, the stepper, the inbox, the Question, Answer and Respond steps, the Sources, Past cases, People and Procedure tabs, the "Test this answer" what-if mode, state badges, plain-language copy, brand tokens and the demo path. Use this skill whenever you build or change anything in src/app or src/ui, touch user-facing text, or plan the demo. It supersedes any earlier one-page dossier layout.
---

# Trustworx UI

## Principles
1. **Jan asks, Trustworx answers.** Every case starts with a question. Every screen answers exactly one thing for Jan.
2. **Plain language.** No engine terms, no snake_case codes, no raw IDs on screen. IDs appear only in the source detail drawer, in mono.
3. **Show what the sources say, never a verdict.** The answer is facts about sources plus a calculation. Actions are phrased as "This procedure says: …", never "You should …".
4. **Answer first, evidence one click deeper, experiments behind a switch.** Progressive disclosure, not everything at once.
5. **One place per fact.** A finding appears once in the answer and once in its tab. Never repeat it in a summary, a table and a list on the same screen.

## Flow and routes
| Step | Route | Jan's question it answers |
|---|---|---|
| Inbox | `/cases` | What needs my attention? |
| 1 Question | `/cases/[id]` | What is being asked, and what do I want checked? |
| 2 Answer | `/cases/[id]/answer?ask=…&tab=…&exclude=…` | What do the sources show, and why can I rely on them? |
| 3 Respond | `/cases/[id]/respond` | What do I send, and what do I decide? |

- A stepper sits at the top of every case page: **Question · Answer · Respond**. Jan can always go back.
- All UI state lives in the URL, so every demo moment can be reopened exactly.

## Inbox
- **Cards, not a table.** Each card shows:
  - client and employee;
  - the first sentence of the question;
  - received, as relative time;
  - the deadline if present ("Due 18 Feb");
  - a status chip: New, In progress, Waiting for confirmation, Correction proposed, Closed.
- Sort by deadline, then received.
- Empty state explains `data:check` and `data:ingest`.

## Step 1: Question
- **The client's message** as a quote (serif), with sender name and time.
- **Attachments** as chips with human names ("Signed amendment", "Email: Request 70%"), taken from the case timeline `source_ids`. Clicking a chip opens the source drawer.
- **Context row:** Client · Employee · Period ("January 2026") · Reported ("€5,000 → €3,500 gross") · Due ("18 Feb 2026").
- **Ask box**, labelled "What do you want Trustworx to check?".
  - Prefilled from the case: "Why did {first name} receive {received} instead of {expected} in {period}?". Jan can edit it (max 300 characters, validated, rendered as text).
- **Suggested questions** under the box, as chips:
  - the playbook check questions in plain words;
  - "What does the procedure say?".
  - Clicking one submits with `ask=<checkId>`.
- **Primary button** "Check with Trustworx" → Answer.
- **Scope line** under the box, small and muted: "Trustworx checks the standard questions for payslip disputes."
  - Milestone 1 does not interpret free text; it only echoes it back as Jan's question.
  - Milestone 2: AI maps free text to checks.

## Step 2: Answer
Top to bottom:
1. **Stepper and one-line context bar.** Client · Employee · Period · Reported · Due · small muted "as of 3 Feb 2026".
2. **"You asked:"** followed by Jan's question.
3. **Scan line**, using real counts from the analysis: "Checked 11 sources · 4 count · 3 don't apply · 1 contradicts".
4. **Answer card "What the sources show":**
   - Two or three sentences built from reason codes. Each claim ends with a source chip (human name) and a state badge. Example: "The signed contract sets Piet at 100% for January [Contract · Backed]. Payroll used 70% [Payroll input, January · Backed], taken from the HR tool entry of 15 January. €5,000 × 70% = €3,500 matches the payslip; the gap is €1,500."
   - When a counted source is `derived_from` another source, say so in words ("taken from the HR tool entry of 15 Jan 2026").
   - If `ask=<checkId>`, lead with that check.
   - **"Check before you act":** only if there are gaps; at most 3 plain-language bullets.
   - **"Test this answer" switch** in the card's top-right corner.
5. **Tabs:** Sources (default) · Past cases · People · Procedure. The tab is in the URL (`tab=`).
6. **Bottom call to action:** "Prepare reply →" goes to Respond.

### Sources tab
- One collapsible section per check. Title = the question; the header shows the badge and the value.
  - Expand the checks the answer card relies on; collapse the rest.
- Inside each section, only three groups: **Counts · Contradicts · Doesn't apply.** Hide empty groups. There is no "other evidence" group.
- **Source row:**
  - human name (type label + key date);
  - a muted second line with system or owner;
  - for "Doesn't apply", a reason chip ("Starts 1 Mar 2026", "Other country: NL", "Replaced by a newer version", "No owner").
- **Drawer:** clicking a row opens it with the full text (serif, quote highlighted) or the fields of a record, plus metadata and the ID in mono.
- **Same origin:** say it inline: "Copied from the January payroll input, not an independent confirmation."

### Past cases tab
- At most 3 cards.
- **Title:** the root cause in plain words (from the vocabulary description).
- **Lines:**
  - "Resolved by {name} · {outcome in words}";
  - "Similar because: same cause, same country";
  - "Different: …", only if not empty.
- **Reversed cases:** a red tag "Later reversed after a complaint", plus one line explaining why that matters.
- "Anonymised" appears as a small label.

### People tab
At most 3 cards. Each has name, role, reasons in words ("Owns the current procedure", "Resolved a similar case that held up"), and a suggested question with a copy button.

### Procedure tab
- **The selected procedure:** title, owner, version, and a "Current" badge.
- **The relevant passage** in serif, with the highlight.
- **"This procedure says: …"**: the next step, framed as the procedure's instruction.
- **"Not used (2)"**, collapsed, with a reason chip per candidate.

### Test this answer (what-if)
- **Off by default.** Nothing about excluding sources is visible until it is switched on.
- **When on:**
  - "Remove from this test" toggles appear on source rows in the Sources and Procedure tabs;
  - a banner reads "Testing: 1 source removed · Reset";
  - the answer card and badges update, and changed items show "was Backed → now Unconfirmed".
- The URL keeps `exclude=`.

## Step 3: Respond
- **Reply draft to the client:**
  - a list of sentences, each with source chips;
  - uncertainty sentences styled distinctly;
  - an origin label ("Template" or "AI draft");
  - a copy button.
- **Decision panel:** the actions available to the user's role, a required rationale, and separate status chips.
- **"Case history" (the timeline)**, collapsed at the bottom.

## State badges
| Engine state | Badge label | Meaning line (tooltip and legend) |
|---|---|---|
| SUPPORTED | Backed | An official source for this question confirms it |
| INDICATION | Unconfirmed | Only sources that aren't official for this question say this |
| CONFLICTING | Conflicting | Official sources disagree |
| INSUFFICIENT | Missing | No source found |

Every badge has icon + label + colour: green check, amber half circle, red split arrows, grey question mark. Never colour alone.

## Copy rules
All strings live in `src/ui/copy.ts`.
- **Source type labels:** contract_change → "Contract" (or "Contract amendment" when a contract already exists); hr_master_data → "HR tool entry"; payroll_input → "Payroll input"; payslip → "Payslip"; time_registration → "Time registration"; procedure → "Procedure"; email → "Email"; chat_message → "Teams message". Add the month or key date: "Payroll input, January 2026".
- **Dates:** "1 Mar 2026". Open ranges: "from 1 Jan 2026" or "until 28 Feb 2026". Hide ranges that are fully open. Never "Open — Open".
- **Amounts:** "€5,000".
- **Root causes, outcomes and reasons:** always in words, from the vocabulary descriptions or `copy.ts`. Never the code.
- **Never on screen:** raw IDs outside the drawer; snake_case codes; "authoritative"; "does not establish"; debug or template labels (except the reply draft's origin); demo-clock wording beyond "as of {date}".

## Brand
- **Name:** Trustworx.
- **Palette:** paper #FAF8F3 (page), card #FFFFFF, line #E7E2D8, ink #1F2340 (text), muted #6B6A75, indigo #4F46E5 (the only accent: buttons, links, active tab, focus), highlighter #FFF3A3 (quote highlights only).
- **State colours** are used only for states: Backed #15803D on #DCFCE7; Unconfirmed #B45309 on #FEF3C7; Conflicting #B91C1C on #FEE2E2; Missing #52525B on #F4F4F5.
- **Type:** IBM Plex Sans 400/500 for the UI; IBM Plex Serif only for quoted source text; IBM Plex Mono only for IDs. Tabular numbers for amounts and percentages. Body 14–16px, headings at most 20px.
- **Accessibility:** AA contrast, visible focus, keyboard-operable tabs, switch and drawer.

## Demo path (optimise for this)
1. Inbox → open Piet's case.
2. Question: Melanie's message and the attachments; the prefilled question → "Check with Trustworx".
3. Answer: the scan line; "What the sources show" (100% agreed, 70% processed, calculation, €1,500 gap).
4. Sources: the contract counts; the amendment "Starts 1 Mar 2026"; the HR tool entry contradicts; the payslip is copied from the payroll input.
5. Past cases: a similar case that held up, and one later reversed after a complaint.
6. People: Sarah (owns the procedure), Ines (resolved the similar case).
7. Test this answer: remove the contract → "Agreed regime" drops to Unconfirmed (only the HR tool entry is left) → Reset.
8. Procedure: "This procedure says: …".
9. Prepare reply → draft → decision.

Everything on this path must work with `LLM_PROVIDER=mock`.
