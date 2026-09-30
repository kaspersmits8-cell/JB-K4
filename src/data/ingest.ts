import type { Connector } from "./connectors/types.ts";
import type { SqliteDatabase } from "../server/db.ts";
import { checkData } from "./check.ts";
import { normalize } from "./normalized.ts";
export function ingestData(db: SqliteDatabase, connector: Connector) {
  const report = checkData(connector);
  if (report.errors) return { ...report, ingested: false, userWarnings: [] as string[] };
  const dataset = report.dataset, normalized = normalize(dataset);
  const users = db.prepare("SELECT id, person_id FROM users ORDER BY id").all() as { id: string; person_id: string }[];
  const userWarnings = users.filter(u => !dataset.people.some(p => p.id === u.person_id)).map(u => `User ${u.id} references missing person ${u.person_id}; access is denied until the person reference is fixed.`);
  db.transaction(() => {
    db.exec("DELETE FROM case_events; DELETE FROM assertions; DELETE FROM fragments; DELETE FROM sources; DELETE FROM cases; DELETE FROM employees; DELETE FROM people; DELETE FROM clients;");
    const client = db.prepare("INSERT INTO clients (id, payload) VALUES (?, ?)"), person = db.prepare("INSERT INTO people (id, payload) VALUES (?, ?)");
    for (const value of dataset.clients) client.run(value.id, JSON.stringify(value));
    for (const value of dataset.people) person.run(value.id, JSON.stringify(value));
    const employee = db.prepare("INSERT INTO employees (id, client_id, payload) VALUES (?, ?, ?)");
    for (const value of dataset.employees) employee.run(value.id, value.client_id, JSON.stringify(value));
    const source = db.prepare("INSERT INTO sources (id, kind, client_id, source_type, status, known_at, visibility, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const value of normalized.sources) source.run(value.id, value.kind, value.kind === "record" ? value.data.client_id : null, value.data.type, value.data.status, value.data.known_at, value.data.visibility, JSON.stringify(value));
    const fragment = db.prepare("INSERT INTO fragments (id, source_id, payload) VALUES (?, ?, ?)");
    for (const value of normalized.fragments) fragment.run(value.id, value.sourceId, JSON.stringify(value));
    const assertion = db.prepare("INSERT INTO assertions (id, source_id, subject_id, attribute, payload) VALUES (?, ?, ?, ?, ?)");
    for (const value of normalized.assertions) assertion.run(value.id, value.sourceId, value.subjectId, value.attribute, JSON.stringify(value));
    const c = db.prepare("INSERT INTO cases (id, client_id, status, payload) VALUES (?, ?, ?, ?)");
    const event = db.prepare("INSERT INTO case_events (id, case_id, payload) VALUES (?, ?, ?)");
    for (const value of dataset.cases) { c.run(value.id, value.client_id, value.status, JSON.stringify(value)); value.timeline.forEach((e, i) => event.run(`${value.id}#event${i}`, value.id, JSON.stringify(e))); }
  })();
  return { ...report, ingested: true, userWarnings };
}
