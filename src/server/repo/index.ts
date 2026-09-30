import type { SqliteDatabase } from "../db.ts";
import type { Client, Person, Employee, CaseData } from "../../data/schemas.ts";
import type { Source, Assertion } from "../../data/normalized.ts";
import { isSafeSummary } from "../../data/check.ts";
export type Role = "consultant" | "payroll_lead";
export type User = { id: string; email: string; personId: string; role: Role };
export type Account = { id: string; email: string; person_id: string; role: string; password_hash: string };
export type Precedent = { id: string; question_type: string; topics: string[]; country: string; root_cause: string; summary: string; decided_by: string; decided_at: string; outcome: { status: string; confirmed_at?: string }; anonymised: boolean };
const payload = <T>(row: unknown): T | null => row ? JSON.parse((row as { payload: string }).payload) as T : null;
export class Repository {
  db: SqliteDatabase;
  constructor(db: SqliteDatabase) { this.db = db; }
  accountByEmail(email: string) { return this.db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email) as Account | undefined; }
  personForProvisioning(personId: string) { return payload<Person>(this.db.prepare("SELECT payload FROM people WHERE id = ?").get(personId)); }
  resolveUser(userId: string): User | null {
    const account = this.db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Account | undefined;
    if (!account || !["consultant", "payroll_lead"].includes(account.role)) return null;
    const person = this.personForProvisioning(account.person_id);
    if (!person || !person.active || person.organisation !== "SDWORX" || person.role !== account.role) return null;
    return { id: account.id, email: account.email, personId: person.id, role: account.role as Role };
  }
  clients(user: User): Client[] {
    const current = this.resolveUser(user.id);
    if (!current) return [];
    const person = this.personForProvisioning(current.personId)!;
    const clients = this.db.prepare("SELECT payload FROM clients ORDER BY id").all().map(row => payload<Client>(row)!);
    return clients.filter(c => current.role === "consultant" ? c.consultant_ids.includes(current.personId) : person.countries?.includes(c.country));
  }
  getClient(user: User, id: string) { return this.clients(user).find(c => c.id === id) || null; }
  getEmployee(user: User, id: string) {
    const employee = payload<Employee>(this.db.prepare("SELECT payload FROM employees WHERE id = ?").get(id));
    return employee && this.getClient(user, employee.client_id) ? employee : null;
  }
  getCase(user: User, id: string) {
    const c = payload<CaseData>(this.db.prepare("SELECT payload FROM cases WHERE id = ?").get(id));
    return c && this.getClient(user, c.client_id) ? c : null;
  }
  cases(user: User) {
    const allowed = new Set(this.clients(user).map(c => c.id));
    return this.db.prepare("SELECT payload FROM cases WHERE status IN ('open', 'reopened') ORDER BY id").all().map(row => payload<CaseData>(row)!).filter(c => allowed.has(c.client_id));
  }
  sources(user: User): Source[] {
    const clients = this.clients(user);
    if (!clients.length) return [];
    return this.db.prepare("SELECT meta_json FROM sources ORDER BY id").all().map(row => JSON.parse((row as { meta_json: string }).meta_json) as Source).filter(source => source.kind === "record" ? clients.some(c => c.id === source.data.client_id) : source.data.scope.client_ids.some(id => id === "*" || clients.some(c => c.id === id)));
  }
  getSource(user: User, id: string) { return this.sources(user).find(s => s.id === id) || null; }
  assertions(user: User, employeeId: string): Assertion[] {
    if (!this.getEmployee(user, employeeId)) return [];
    const allowed = new Set(this.sources(user).map(s => s.id));
    return this.db.prepare("SELECT payload FROM assertions WHERE subject_id = ? ORDER BY id").all(employeeId).map(row => payload<Assertion>(row)!).filter(a => allowed.has(a.sourceId));
  }
  experts(user: User): Person[] {
    if (!this.resolveUser(user.id)) return [];
    return this.db.prepare("SELECT payload FROM people ORDER BY id").all().map(row => payload<Person>(row)!).filter(p => p.active && p.organisation === "SDWORX" && p.role !== "client_hr");
  }
  precedents(user: User): Precedent[] {
    if (!this.resolveUser(user.id)) return [];
    const allowed = new Set(this.clients(user).map(c => c.id));
    const clients = this.db.prepare("SELECT payload FROM clients").all().map(row => payload<Client>(row)!);
    const names = this.db.prepare("SELECT payload FROM employees").all().map(row => payload<Employee>(row)!.name);
    return this.db.prepare("SELECT payload FROM cases WHERE status IN ('closed', 'reopened') ORDER BY id").all().map(row => payload<CaseData>(row)!).filter(c => c.resolution && c.outcome).map(c => ({
      id: c.id, question_type: c.question_type, topics: c.topics, country: clients.find(client => client.id === c.client_id)?.country || "", root_cause: c.resolution!.root_cause,
      summary: isSafeSummary(c.resolution!.summary, names) ? c.resolution!.summary : "", decided_by: c.resolution!.decided_by, decided_at: c.resolution!.decided_at,
      outcome: { status: c.outcome!.status, confirmed_at: c.outcome!.confirmed_at }, anonymised: !allowed.has(c.client_id),
    }));
  }
  decisions(user: User, caseId: string) {
    if (!this.getCase(user, caseId)) return null;
    return this.db.prepare("SELECT id, case_id, actor_id, action, rationale, at FROM decisions WHERE case_id = ? ORDER BY rowid").all(caseId) as Decision[];
  }
  status(user: User, caseId: string) {
    if (!this.getCase(user, caseId)) return null;
    const row = this.db.prepare("SELECT payload FROM case_status_events WHERE case_id = ? ORDER BY rowid DESC LIMIT 1").get(caseId);
    return payload<CorrectionState>(row) || { stage: "none" as const, proposedBy: null };
  }
  hasData() { return Boolean(this.db.prepare("SELECT id FROM cases LIMIT 1").get()); }
  appendDecision(user: User, decision: Decision, correction: CorrectionState | null) {
    if (!this.getCase(user, decision.case_id) || decision.actor_id !== user.id) throw new Error("Decision outside user scope");
    this.db.prepare("INSERT INTO decisions (id, case_id, actor_id, action, rationale, at) VALUES (?, ?, ?, ?, ?, ?)").run(decision.id, decision.case_id, decision.actor_id, decision.action, decision.rationale, decision.at);
    if (correction) this.db.prepare("INSERT INTO case_status_events (id, case_id, status, payload) VALUES (?, ?, ?, ?)").run(decision.id, decision.case_id, correction.stage, JSON.stringify(correction));
  }
}
export type Decision = { id: string; case_id: string; actor_id: string; action: string; rationale: string; at: string };
export type CorrectionState = { stage: "none" | "proposed" | "approved" | "executed" | "confirmed"; proposedBy: string | null };
