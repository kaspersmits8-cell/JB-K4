# research/ (not loaded by the app)

Source material kept for reference and future playbook checks. Nothing here is read by the loader.

| File | Original source | Why not in data/ |
|---|---|---|
| team_payslip_summary.csv | system/team_payslip_summary.csv | Team data: DATA_CONTRACT §11 "don't build" |
| parameter_changes.csv | system/parameter_changes.csv | Tax parameters: no record type or playbook check |
| official_declarations_dimona_dmfa.json | system/employee.json (official_declarations) | Dimona/DmfA: no record type |
| hr_tool_audit_log.csv | system/hr_tool_audit_log.csv | Audit log: key facts copied into REC-0003 (known_at, note) |
| badge_nov2025_jan2026.csv | system/badge_nov2025_jan2026.csv | Raw badge data: §11 "don't build" |
| telework_nov2025_jan2026.csv | system/telework_nov2025_jan2026.csv | Raw telework: summarised in REC-0006 note |
| protime_nov2025_jan2026.csv | system/protime_nov2025_jan2026.csv | Raw daily data: summarised in REC-0006 |
| payslips.csv | system/payslips.csv | Nov/Dec 2025 history not needed; Jan converted to REC-0005 |
| not_converted_fields.json | client.json, employee.json, contracts, hr_tool_employee.json, ticket.json, D1/D3 metadata | Fields with no place in the contract (payroll calendar, source policies, deadline, schedules, e-signature, manager approvals, email cc, PC scope) |
