import { z } from "zod";
import { clientSchema, personSchema, employeeSchema, recordSchema, documentSchema, caseSchema } from "./schemas.ts";
import type { Dataset, Entity } from "./schemas.ts";
import type { Connector, Issue } from "./connectors/types.ts";
export function checkData(connector: Connector) {
  const read = connector.read();
  const issues: Issue[] = [...read.issues];
  const dataset: Dataset = { clients: [], people: [], employees: [], records: [], documents: [], cases: [] };
  const origins = new Map<string, string>();
  const add = (entity: Entity, field: string, message: string, severity: "error" | "warn" = "error", hint = "Correct the field or its referenced ID in the authored dataset.") => issues.push({ file: origins.get(entity.id) || entity.id, field, message, severity, hint });
  const schemas: Record<keyof Dataset, z.ZodType> = { clients: clientSchema, people: personSchema, employees: employeeSchema, records: recordSchema, documents: documentSchema, cases: caseSchema };
  for (const input of read.sources) {
    const parsed = schemas[input.kind].safeParse(input.raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) issues.push({ file: input.file, severity: "error", field: issue.path.join("."), message: issue.message, hint: "Use the field type and allowed values in DATA_CONTRACT.md and vocabulary.json." });
      continue;
    }
    const entity = parsed.data as Entity;
    if (origins.has(entity.id)) issues.push({ file: input.file, severity: "error", field: "id", message: `Duplicate ${entity.id}; first seen in ${origins.get(entity.id)}`, hint: "Assign a unique ID." });
    else origins.set(entity.id, input.file);
    (dataset[input.kind] as Entity[]).push(input.kind === "documents" ? { ...entity, body: input.body || "" } as Entity : entity);
  }
  const sets = Object.fromEntries(Object.entries(dataset).map(([kind, entries]) => [kind, new Set(entries.map((e: Entity) => e.id))])) as Record<keyof Dataset, Set<string>>;
  const sourceIds = new Set([...sets.records, ...sets.documents]);
  const ref = (entity: Entity, field: string, value: string | null | undefined, allowed: Set<string>) => { if (value && !allowed.has(value)) add(entity, field, `Unknown reference ${value}`); };
  const period = (entity: Entity, from: string | null, to: string | null, field: string) => { if (from && to && from > to) add(entity, field, "Start date is after end date"); };
  const employeeClient = (entity: Entity, employeeId: string, clientId: string) => {
    ref(entity, "employee_id", employeeId, sets.employees); ref(entity, "client_id", clientId, sets.clients);
    if (dataset.employees.find(e => e.id === employeeId)?.client_id !== clientId) add(entity, "employee_id", `${employeeId} does not belong to ${clientId}`);
  };
  for (const client of dataset.clients) for (const person of client.consultant_ids) ref(client, "consultant_ids", person, sets.people);
  for (const person of dataset.people) if (person.organisation !== "SDWORX") ref(person, "organisation", person.organisation, sets.clients);
  for (const employee of dataset.employees) ref(employee, "client_id", employee.client_id, sets.clients);
  for (const record of dataset.records) {
    employeeClient(record, record.employee_id, record.client_id); ref(record, "approved_by", record.approved_by, sets.people); period(record, record.valid_from, record.valid_to, "valid_from");
    for (const derived of record.derived_from) ref(record, "derived_from", derived, sets.records);
  }
  for (const doc of dataset.documents) {
    period(doc, doc.valid_from, doc.valid_to, "valid_from"); ref(doc, "owner", doc.owner, sets.people); ref(doc, "supersedes", doc.supersedes, sets.documents); ref(doc, "case_id", doc.case_id, sets.cases); ref(doc, "from", doc.from, sets.people);
    for (const person of doc.to || []) ref(doc, "to", person, sets.people);
    for (const client of doc.scope.client_ids) if (client !== "*") ref(doc, "scope.client_ids", client, sets.clients);
    for (const employee of doc.scope.employee_ids || []) ref(doc, "scope.employee_ids", employee, sets.employees);
    if (!doc.owner) add(doc, "owner", "Document has no owner", "warn", "Fine if intended; this document cannot be authoritative.");
    if (doc.status === "approved" && !doc.version) add(doc, "version", "Approved document has no version", "warn");
    doc.assertions.forEach((a, index) => {
      ref(doc, `assertions.${index}.subject`, a.subject, sets.employees);
      const employee = dataset.employees.find(e => e.id === a.subject);
      if (!employee || (!doc.scope.client_ids.includes("*") && !doc.scope.client_ids.some(value => value === employee.client_id)) || (doc.scope.employee_ids && !doc.scope.employee_ids.includes(a.subject))) add(doc, `assertions.${index}.subject`, "Assertion subject is outside document scope");
      if (!doc.body.includes(a.quote)) add(doc, `assertions.${index}.quote`, "Quote not found literally in body", "error", "Copy the exact body text, including spaces and punctuation.");
      period(doc, a.valid_from, a.valid_to, `assertions.${index}.valid_from`);
    });
  }
  for (const c of dataset.cases) {
    employeeClient(c, c.employee_id, c.client_id); ref(c, "reporter_id", c.reporter_id, sets.people); ref(c, "assigned_to", c.assigned_to, sets.people); period(c, c.disputed_period.from, c.disputed_period.to, "disputed_period");
    if (c.status === "open" && !c.assigned_to) add(c, "assigned_to", "Open case has no assignee", "warn");
    if (c.reported?.basis === "unknown") add(c, "reported.basis", "Gross/net basis needs confirmation", "warn");
    for (const event of c.timeline) { ref(c, "timeline.actor_id", event.actor_id, sets.people); for (const source of event.source_ids) ref(c, "timeline.source_ids", source, sourceIds); }
    if (c.resolution) {
      ref(c, "resolution.decided_by", c.resolution.decided_by, sets.people);
      for (const source of c.resolution.source_ids) ref(c, "resolution.source_ids", source, sourceIds);
      if (!isSafeSummary(c.resolution.summary, dataset.employees.map(e => e.name))) add(c, "resolution.summary", "Precedent summary contains an employee name or amount", "warn", "Anonymise the summary; unsafe text is suppressed outside client scope.");
    }
  }
  // Traversal must terminate even if authored lineage is cyclic.
  for (const record of dataset.records) {
    const visit = (current: string, chain: Set<string>): boolean => chain.has(current) || (dataset.records.find(r => r.id === current)?.derived_from || []).some(parent => visit(parent, new Set([...chain, current])));
    if (visit(record.id, new Set())) add(record, "derived_from", "Cyclic source lineage", "error", "Remove the circular derived_from reference.");
  }
  issues.sort((a, b) => a.file.localeCompare(b.file) || a.field.localeCompare(b.field) || a.message.localeCompare(b.message));
  for (const entries of Object.values(dataset)) entries.sort((a: Entity, b: Entity) => a.id.localeCompare(b.id));
  return { dataset, issues, fileCount: read.fileCount, errors: issues.filter(i => i.severity === "error").length, warnings: issues.filter(i => i.severity === "warn").length };
}
export function isSafeSummary(summary: string, names: string[]) { return !names.some(name => summary.toLowerCase().includes(name.toLowerCase())) && !/\d[\d.,\s]*\s*(?:€|EUR)/i.test(summary); }
export function formatReport(result: ReturnType<typeof checkData>) {
  return [...result.issues.map(i => `${i.file}  ${i.severity}  ${i.field}: ${i.message}. ${i.hint}`), `${result.errors} errors, ${result.warnings} warnings in ${result.fileCount} files`].join("\n");
}
