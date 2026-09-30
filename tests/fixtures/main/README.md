# Main-case test fixture

Derived from docs/data-templates and tests/helpers/data.ts. This is test input,
not teammate-authored demo data. Adds the salary, payslip, fallback email,
foreign open case, second lead, and reversed precedent needed for acceptance
checks. No accounts or passwords are supplied.

Point DATA_DIR here and DB_PATH at a separate .local database to inspect it.
Pin DEMO_NOW to 2026-02-01T09:15:00Z. Provision P-0001 as consultant through
user:create; P-0002 and P-0005 are payroll leads for four-eyes checks.
