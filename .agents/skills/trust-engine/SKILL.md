---
name: trust-engine
description: Rules and implementation guide for the Trust Dossier trust engine. Covers how evidence becomes findings with a state (Supported, Indication, Conflicting, Insufficient); applicability and its reason codes; per-question authority; conflicts, comparisons and derivations; next steps and gaps; precedent and expert ranking; and the what-if feature that excludes a source. All of it is driven by config/playbooks. Use this skill whenever you create or change anything in src/engine, config/playbooks, the Analysis type, finding states, reason codes, or precedent or expert ranking. Also use it for any code that decides or displays what a user can trust, even when the task is phrased as an API or UI change.
---

# Trust engine

## Why it exists
SD Worx employees can already *find* information. What they can't tell is whether it applies to this client, this employee and this period, and whether it deserves confidence. The engine answers that deterministically, so every state on screen traces back to a rule and a source. Judges score "does it work" and "fit with the challenge". SD Worx told us they don't want another unreliable AI answer, so reproducible rules are our credibility.

## Hard rules
- **Pure functions only.** Inputs in, `Analysis` out. No DB, network, LLM, `Date.now()` or randomness; `asOf` is a parameter.
- **No numeric trust scores or percentages.** Output states plus reason codes.
- **Reasons are codes, not prose.** Every state, exclusion and ranking carries machine-readable reason codes. The UI (`copy.ts`) and the AI layer turn codes into words; they never invent reasons.
- **Domain choices live in the playbook** (`config/playbooks/*.json`); the engine holds generic logic. A new question type should mean a new playbook, plus at most a new named derivation function.

## Inputs
`analyzeCase(input)`, where `input` has:
- `case`, `employee`, `client`, `playbook`
- `assertions`: every assertion about this employee, from records and documents, already scope-filtered by the repo
- `documents`: metadata of procedures and policies
- `precedents`: closed cases, already anonymised by the repo where needed
- `people`, `asOf`, `excludedSourceIds`

## Pipeline
1. **Periods.** `disputed` = `case.disputed_period`; `current` = the date of `asOf`.
2. **Collect.** For each playbook check, take assertions with a matching `attribute` and `subjectId`.
3. **Applicability** per assertion (table below). Keep non-applicable assertions in `notApplicable` with their reasons and never drop them silently: showing why the old email doesn't count is a demo moment.
4. **Classify** each applicable assertion as `authoritative`, `supporting`, or ignored for this check.
5. **State** per check (decision table below).
6. **Comparisons** between checks produce an outcome key.
7. **Derivations**: named pure functions produce explained numeric findings.
8. **Next step** from the playbook's `outcome_rules`. Attach the current procedure if `needs_procedure`.
9. **Gaps**: every non-Supported finding, a missing procedure, `reported.basis = unknown`, and informal contradictions.
10. **Precedents** and **experts**.
11. Return an `Analysis` with `analysisVersion`, `asOf` and `excludedSourceIds`.

## Applicability reason codes
| Code | Rule |
|---|---|
| `other_period` | assertion validity `[valid_from, valid_to]` does not overlap the relevant period (null bounds are open) |
| `other_client` | document scope excludes the case client, or the record's `client_id` differs |
| `other_country` | document scope excludes the client's country |
| `not_yet_known` | source `known_at` is after `asOf` |
| `superseded` | status is `superseded`, or an applicable approved document `supersedes` it |
| `rejected` | status is `rejected` |
| `excluded_by_user` | the source id is in `excludedSourceIds` (what-if mode) |

Return all reasons that apply, not just the first.

## Classification: authority is per question
An applicable assertion is **authoritative** for a check when both hold:
- it matches one of `check.authoritative` (kind, types, statuses);
- its source is owned: records always are (by their system), documents need a non-null `owner`.

It is **supporting** when it matches `check.supporting`. Otherwise it is ignored for this check.

Record downgrades as notes: `ownerless_document`, `unverified_source`, `status_not_authoritative`.

Never build a global ranking of source types. A `payroll_input` is authoritative for "what was processed" and irrelevant for "what was agreed".

**Independence.** If one counted source is in another's `derived_from` chain, set `sameOriginAs` on both. The UI must not present them as two independent confirmations.

## Finding state decision table
A = values of authoritative assertions; S = values of supporting assertions, after dedup by origin.

| Condition | State | Value |
|---|---|---|
| A non-empty, all equal | `SUPPORTED` | A's value. Any S value that differs goes to `contradicting` and adds gap `informal_contradiction` |
| A has two or more distinct values | `CONFLICTING` | none; list all |
| A empty; S non-empty, all equal | `INDICATION` | S's value |
| A empty; S has two or more distinct values | `CONFLICTING` | none |
| A and S empty | `INSUFFICIENT` | none |

Equality: numbers compare exactly (units come from the vocabulary); strings compare case-insensitively after trimming.

## Comparisons
The outcome is `match` or `mismatch` only when both sides are `SUPPORTED`. Otherwise it is `not_established`, and the gap names the weaker side. Never conclude a mismatch from an Indication.

## Derivations
Named pure functions in `src/engine/derivations.ts`, registered by name.

`regimeExplainsPaidAmount({ reference, processedRegime, agreedRegime, paid })`:
- Requires `reference`, `processedRegime` and `paid` to be `SUPPORTED`; otherwise returns `not_established` plus the missing inputs.
- Computes `expectedAtProcessed = reference × processedRegime / 100`. If |expectedAtProcessed − paid| ≤ 1 EUR → `explains_paid_amount`; else `does_not_explain` with the difference.
- If `agreedRegime` is `SUPPORTED`, also computes `expectedAtAgreed` and `gap = expectedAtAgreed − paid`, and compares the gap with `case.reported`.
- Returns numbers and codes, never prose.

## Procedures
- **Candidates:** documents of type procedure or policy whose topics intersect `playbook.procedure_topics`.
- **Applicability is evaluated at `current` (asOf), not the disputed period.** Extra reason codes: `no_owner`, `not_approved`.
- **Selection:** the applicable, approved, owned, non-superseded candidate with the latest `valid_from`.
- If none qualifies → gap `no_current_procedure`. Return all other candidates with their reasons.

## Precedents
- **Candidates:** closed or reopened cases with the same `question_type` that the repo gave you.
- **Internal score** (integer, never displayed):
  - +3 when `resolution.root_cause` equals the hypothesis;
  - +1 per shared topic;
  - +1 for the same country.
- **Output:** `matchReasons` (`same_root_cause`, `shared_topic:<t>`, `same_country`) and `differences` (`other_country:<c>`, `other_root_cause:<r>`).
- **Outcome-aware:** if `outcome.status` is `reversed` or `complaint_reopened`, flag `later_reversed`, rank it below confirmed precedents with an equal score, and never use it as evidence for an expert.
- Return the top 3.

## Experts
- **Candidates:** active SD Worx people (not client_hr), excluding the current user.
- **Internal score:**
  - +3 owns the selected procedure;
  - +2 per responsibility in `playbook.expert_topics`;
  - +1 country match;
  - +3 decided a *confirmed* precedent with the same root cause.
- Return the top 3 with all reasons, plus the playbook's `expert_question` key for the AI layer to phrase.

## What-if (stress test)
- `analyzeCase` with `excludedSourceIds`, plus `diffAnalyses(base, whatIf)`.
- The diff returns changed findings (state and value before → after), a changed outcome and a changed next step.
- This is the demo climax: exclude the approved contract change, and "Agreed regime" drops from Supported to Indication while the next step becomes "request confirmation".

## Analysis shape
Define it in `src/engine/types.ts`. It is the contract between engine, API, UI and AI, so it must be serializable JSON with `analysisVersion: 1`.

Parts: `context`, `findings[]`, `comparisons[]`, `derivations[]`, `outcome`, `nextStep`, `procedure { selected, notApplicable[] }`, `gaps[]`, `precedents[]`, `experts[]`, `evidenceIndex`.

`evidenceIndex` maps each assertion id to source metadata plus a locator (record field, or document fragment id with a quote). Evidence refs anywhere in the Analysis must resolve in `evidenceIndex`.

## Required tests (Vitest, fixtures in `tests/fixtures/`)
| Scenario | Expected |
|---|---|
| main case | agreed 100 SUPPORTED; processed 70 SUPPORTED; mismatch; next `start_correction_review`; the Nov 2025 70% email in notApplicable with `other_period`; derivation `explains_paid_amount`, gap 1500 |
| exclude the approved 100% change | agreed INDICATION 100 (from the unverified mail); outcome `not_established`; next `request_confirmation` |
| processed correctly | both 70 SUPPORTED; match; `explain_to_client` |
| two approved overlapping changes with different values | CONFLICTING |
| no sources | INSUFFICIENT |
| only an ownerless procedure | no selected procedure; reason `no_owner`; gap `no_current_procedure` |
| NL procedure, BE client | `other_country` |
| source known after asOf | `not_yet_known` |
| reversed precedent | flag `later_reversed`, ranked below a confirmed one |
| payslip derived from payroll_input | `sameOriginAs` set |
| determinism | same input twice → deep-equal output |

## Anti-patterns
- Calling an LLM from the engine.
- Hiding not-applicable sources.
- A global ranking of source types.
- A confidence number.
- Free-text reasons built in the engine.
- Reading the clock inside the engine.
- Special-casing ids from the demo data.
