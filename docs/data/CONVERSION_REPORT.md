# Conversion report: "Piet's January payslip" → Trust Dossier data contract

Pre-flight check: a re-implementation of DATA_CONTRACT.md §10 returns **0 errors, 6 warnings** (all "document without an owner", intended: D2, T1 and the four emails). The same checker passes the official templates, so it reads the format the same way. `npm run data:check` remains authoritative.

## 1. Mapping: original file → new file(s)

| Original | New |
|---|---|
| system/client.json | data/clients.json (CL-0001) + research/not_converted_fields.json (policies, payroll calendar) |
| system/employee.json | data/employees.json (E-0001) + research/official_declarations_dimona_dmfa.json |
| system/employment_contract.json | data/records/REC-0001-contract-fulltime.json |
| system/contract_amendment.json | data/records/REC-0002-amendment-70pct-from-march.json |
| system/hr_tool_employee.json | data/records/REC-0003-hr-tool-regime-70pct-from-january.json (+ telework agreement, approvals → research) |
| system/hr_tool_audit_log.csv | research/hr_tool_audit_log.csv (known_at and note copied into REC-0003) |
| system/payroll_calc_log.csv (Jan run) | data/records/REC-0004-payroll-input-2026-01.json (warnings in note) |
| system/payslips.csv (Jan) | data/records/REC-0005-payslip-2026-01.json; full file → research/payslips.csv |
| system/protime_nov2025_jan2026.csv | data/records/REC-0006-protime-summary-2026-01.json; raw → research/ |
| system/badge_nov2025_jan2026.csv | research/ |
| system/telework_nov2025_jan2026.csv | research/ (summarised in REC-0006 note) |
| system/team_payslip_summary.csv | research/ |
| system/parameter_changes.csv | research/ |
| case/ticket.json | data/cases/CASE-0001-open-piet-january-payslip.json (+ deadline, priority → research) |
| case/emails/E1–E4.json | data/documents/DOC-0005 … DOC-0008 |
| knowledge/D1 | data/documents/DOC-0001-procedure-regime-changes-be-v2.md |
| knowledge/D2 | data/documents/DOC-0002-processing-hr-changes-2020.md |
| knowledge/D3 | data/documents/DOC-0003-procedure-working-hours-nl.md |
| knowledge/T1 | data/documents/DOC-0004-teams-tom-hr-tool-leading.md |
| knowledge/precedents.json C1–C8 | data/cases/CASE-0002 … CASE-0009 |
| knowledge/people.json | data/people.json (P-0001 Jan, P-0002 Sarah, P-0003 Ines, P-0004 Tom) |
| config/playbooks/*.yaml, config/stubs/*.yaml | not converted (per instruction) |
| answer_key.json | tests/answer_key.json (rewritten as findings) |
| README.md, generate.py | not converted |
| (new) | P-0005 payroll lead, P-0006 NL consultant, P-0007 former consultant, P-0010 Melanie, P-0011–P-0014 client HR contacts; CL-0002–CL-0005; E-0002–E-0010; CASE-0010 |

## 2. Fields set to null or guessed

**Null (genuinely unknown):** `valid_from`/`valid_to` of D1, D2, D3 (source only has a last-updated date); `owner` of D2, T1 and emails; `version` of D2; `from` of DOC-0005 and DOC-0007 and empty `to` of DOC-0006 and DOC-0004 (sender/recipient is Piet or a channel, not a person id); `valid_to` of REC-0002, REC-0003.

**Guessed or derived (please review):**
- **Timezone:** all source times read as Brussels local (UTC+1) and converted to UTC.
- **Times at 00:00:00Z** where only a date is known: REC-0001 known_at (hire date), REC-0004 known_at (closing date), REC-0005 known_at (payment date), REC-0006 known_at (closing date), known_at of D1/D2/D3 (last-updated date), opened_at and decided_at of all precedents (closed date).
- **REC-0002 known_at** = ticket time, because SD Worx only received the amendment as a ticket attachment.
- **Emails E1–E3 known_at** = ticket time (attachments); `sent_at` keeps the original date.
- **D3 owner** = P-0006 (invented NL consultant); the source owner was a team, "nl.payroll.team".
- **Roles:** Sarah = `expert` per your instruction, although the source calls her Payroll Team Lead. Ines = `expert` (source: Senior Payroll Consultant). Payroll lead P-0005 "Lucas Dierckx" invented.
- **Invented people:** P-0005, P-0006 "Femke van Dijk", P-0007 placeholder (inactive) for "former.consultant", client HR placeholders P-0011–P-0014, all precedent employees E-0002–E-0010.
- **Client consultants:** CL-0003 and CL-0005 → Ines, CL-0004 → P-0007 (derived from who handled their cases).
- **Precedents:** channel `ticket`, reporter (Melanie for Stride, placeholders elsewhere), `question_text` reconstructed, `disputed_period` = month before closure (only C1 derivable from the source), employee_category (E-0010 blue_collar from PC 118).
- **C2:** status `closed` with outcome `complaint_reopened` (source: corrected two months later). Change to `reopened` if you meant the case status. Root cause set to the final cause `work_regime_not_updated` (§11 "same root cause"), although the original decision treated the payslip as correct.
- **Root-cause mapping:** C3, C4, C7 → `processed_correctly`; C5, C8 → `other`; C6 → `absence_miscoded`. C4 outcome `pending` (source: no feedback).
- **CASE-0010** (open case at CL-0002): content invented.
- **Assertions:** E1 has none (a request, not a fact); E2's "Until then nothing changes" not pinned (the text doesn't state a value).

## 3. Vocabulary values wanted but not used

- **root_causes:** `regime_change_wrong_effective_date` (more precise than the placeholder), `overtime_not_approved`, `meal_vouchers_not_granted`.
- **topics:** `overtime`, `holiday_pay`, `meal_vouchers`, `telework`.
- **attributes:** `weekly_hours`, `worked_hours`, `net_paid`.
- **roles:** `employee` (so Piet can be `from`/`to` on emails).
- **record_types:** `official_declaration` (Dimona/DmfA), `audit_log`.

## 4. Deviations from DATA_CONTRACT §11

Your story differs from the §11 scenario: here Piet is agreed 100% until 2026-02-28 and 70% from 2026-03-01, with 70% processed from January. The main finding (agreed 100 vs processed 70; 5000 × 70% = 3500) still holds. The full-time reference salary sits on the contract record (per your instruction), not on `hr_master_data`. §11 item 5 is covered by D2 being both superseded and ownerless (one document instead of two). §11 item 9 (second open case at CL-0001, E-0002 processed correctly) is **not built** because you didn't ask for it. REC-0006 (`time_registration`) should only stay if a playbook check uses it.

## 5. Post-review changes (v1 package)

- **DOC-0007:** removed the pinned assertion `work_regime_pct: 100` quoting "I worked full-time all of January". It is Piet's statement about hours worked, not the agreed regime; as evidence it would let the complainant support his own claim. The assertion for the 3,500 paid amount stays.
- **tests/answer_key.json:** finding 6 rewritten to match; every finding now has `milestone1_expectation` (what the deterministic engine should return, or null when not covered yet); `demo_now` added.
- **docs/data/INSTALL.md:** added (install steps, `DEMO_NOW=2026-02-03T12:00:00Z`, logins, expected dossier, known risk).
- No other data changed.
