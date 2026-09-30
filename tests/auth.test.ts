import { expect, test } from "vitest";
import { openDatabase } from "../src/server/db.ts";
import { migrate } from "../src/server/storage.ts";
import { Repository } from "../src/server/repo/index.ts";
import { createUser, authenticate } from "../src/server/auth.ts";
import { ingestData } from "../src/data/ingest.ts";
import { fixtureConnector, mainData } from "./helpers/data.ts";

test("scope is enforced for cases, sources, employees and foreign precedents", async () => {
  const db = openDatabase(":memory:"); migrate(db);
  try {
    const data = mainData(); ingestData(db, fixtureConnector(data)); const repo = new Repository(db);
    const jan = await createUser(repo, { email: "jan@example.com", personId: "P-0001", role: "consultant", password: "test-password-123" });
    expect((repo.accountByEmail(jan.email)?.password_hash || "").slice(0, 7)).toBe("$2b$12$");
    expect(await authenticate(repo, jan.email, "test-password-123")).toEqual(jan);
    expect(await authenticate(repo, jan.email, "incorrect-password")).toBeNull();
    expect(repo.getCase(jan, "CASE-0002")).toBeNull(); expect(repo.getEmployee(jan, "E-0101")).toBeNull();
    expect(repo.cases(jan).map(c => c.id)).toEqual(["CASE-0001"]);
    const precedent = repo.precedents(jan)[0]; expect(precedent.anonymised).toBe(true);
    expect(precedent).not.toHaveProperty("employee_id"); expect(precedent).not.toHaveProperty("reported"); expect(precedent).not.toHaveProperty("question_text"); expect(precedent.outcome).not.toHaveProperty("note");
    data.cases.find(c => c.id === "CASE-0901")!.resolution!.summary = "Lotte Visser was paid 1234 EUR";
    ingestData(db, fixtureConnector(data)); expect(repo.precedents(jan)[0].summary).toBe("");
    const lead = await createUser(repo, { email: "lead@example.com", personId: "P-0002", role: "payroll_lead", password: "test-password-123" });
    expect(repo.getCase(lead, "CASE-0001")).not.toBeNull(); expect(repo.getCase(lead, "CASE-0002")).toBeNull();
  } finally { db.close(); }
});
test("user creation and existing sessions deny unsupported, unknown, inactive and mismatched roles", async () => {
  const db = openDatabase(":memory:"); migrate(db);
  try {
    ingestData(db, fixtureConnector(mainData())); const repo = new Repository(db);
    for (const role of ["expert", "client_hr", "admin", "unknown"]) await expect(createUser(repo, { email: "invalid@example.com", personId: "P-0003", role, password: "test-password-123" })).rejects.toThrow();
    await expect(createUser(repo, { email: "invalid@example.com", personId: "P-0003", role: "consultant", password: "test-password-123" })).rejects.toThrow();
    const jan = await createUser(repo, { email: "jan@example.com", personId: "P-0001", role: "consultant", password: "test-password-123" });
    for (const role of ["expert", "client_hr", "unknown"]) {
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, jan.id);
      expect(repo.resolveUser(jan.id)).toBeNull(); expect(repo.cases(jan)).toEqual([]); expect(repo.sources(jan)).toEqual([]); expect(repo.precedents(jan)).toEqual([]);
    }
    db.prepare("UPDATE users SET role = 'consultant' WHERE id = ?").run(jan.id);
    const data = mainData(); data.people.find(p => p.id === jan.personId)!.active = false; ingestData(db, fixtureConnector(data));
    expect(repo.resolveUser(jan.id)).toBeNull();
  } finally { db.close(); }
});
test("ingest warns about orphaned users; new logins and existing sessions are denied until restored", async () => {
  const db = openDatabase(":memory:"); migrate(db);
  try {
    const data = mainData(); ingestData(db, fixtureConnector(data)); const repo = new Repository(db);
    // An otherwise unreferenced lead isolates removal of the person from dangling dataset references.
    const user = await createUser(repo, { email: "second.lead@example.com", personId: "P-0005", role: "payroll_lead", password: "test-password-123" });
    const removed = structuredClone(data); removed.people = removed.people.filter(p => p.id !== "P-0005");
    const result = ingestData(db, fixtureConnector(removed));
    expect(result.ingested).toBe(true); expect(result.userWarnings).toEqual([expect.stringContaining("P-0005")]);
    expect(repo.accountByEmail(user.email)).toBeDefined(); expect(repo.resolveUser(user.id)).toBeNull();
    expect(await authenticate(repo, user.email, "test-password-123")).toBeNull(); expect(repo.cases(user)).toEqual([]); expect(repo.getCase(user, "CASE-0001")).toBeNull();
    ingestData(db, fixtureConnector(data)); expect(repo.resolveUser(user.id)).toEqual(user); expect(await authenticate(repo, user.email, "test-password-123")).toEqual(user);
  } finally { db.close(); }
});
