---
id: DOC-0001
type: procedure
title: "Procedure - working regime changes (Belgium)"
owner: P-0002
version: "2.0"
status: approved
supersedes: DOC-0002
valid_from: null
valid_to: null
known_at: 2026-01-12T00:00:00Z
scope:
  countries: [BE]
  client_ids: ["*"]
topics: [payroll_correction, work_regime]
visibility: internal
---
# Working regime changes (BE)

1. The **signed contract or contract amendment is leading** for the new regime and its effective date. HR tool entries must match it.
2. Apply the new regime **from the effective date in the signed document**, never from the date of entry in any system.
3. Before closing, check the payroll calculation log for regime-change warnings (retroactive effective dates, hours exceeding the regime). Every warning must be acknowledged.
4. If a regime was applied from a wrong date and the payroll is already closed:
   - correct the effective date in the source system (ask the client HR to do this if it's their tool);
   - process a **retro correction** in the next payroll run and issue a correction payslip;
   - if the underpayment is significant, propose an **off-cycle payment** (requires client HR approval).
5. Check the next DmfA declaration reflects the correct regime per quarter.
