import { checkData } from "../../src/data/check.ts";
import { FileConnector } from "../../src/data/connectors/file.ts";
import type { Dataset } from "../../src/data/schemas.ts";
import type { Connector, SourceInput } from "../../src/data/connectors/types.ts";
export function baseData(): Dataset { return structuredClone(checkData(new FileConnector("tests/fixtures/base")).dataset); }
export function fixtureConnector(dataset: Dataset): Connector {
  return { read: () => ({ sources: Object.entries(dataset).flatMap(([kind, entries]) => entries.map(raw => ({ kind: kind as SourceInput["kind"], file: `${kind}/${raw.id}`, raw, body: "body" in raw ? raw.body : undefined }))), issues: [], fileCount: Object.values(dataset).reduce((sum, values) => sum + values.length, 0) }) };
}
export function mainData(): Dataset {
  const d = baseData();
  d.records.push({ ...d.records[0], id: "REC-0003", type: "hr_master_data", facts: [{ attribute: "fulltime_reference_salary_gross", value: 5000 }] });
  d.records.push({ ...d.records[1], id: "REC-0005", type: "payslip", visibility: "client_shareable", derived_from: ["REC-0004"], facts: [{ attribute: "work_regime_pct", value: 70 }, { attribute: "base_salary_gross_paid", value: 3500 }] });
  const email = d.documents.find(doc => doc.type === "email")!;
  d.documents.push({ ...email, id: "DOC-0003", known_at: "2025-12-15T09:00:00Z", visibility: "client_shareable", body: "Returns to full-time in January.", assertions: [{ subject: "E-0001", attribute: "work_regime_pct", value: 100, valid_from: "2026-01-01", valid_to: null, quote: "Returns to full-time in January." }] });
  d.cases.push({ ...d.cases[0], id: "CASE-0002", client_id: "CL-0002", employee_id: "E-0101", reporter_id: "P-0011", assigned_to: "P-0004" });
  d.people.push({ ...d.people[1], id: "P-0005", email: "lead.two@example.com", name: "Second Lead" });
  return d;
}
