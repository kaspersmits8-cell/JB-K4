import { expect, test } from "vitest";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkData, formatReport } from "../src/data/check.ts";
import { FileConnector } from "../src/data/connectors/file.ts";
import { normalize } from "../src/data/normalized.ts";
import { openDatabase } from "../src/server/db.ts";
import { migrate } from "../src/server/storage.ts";
import { ingestData } from "../src/data/ingest.ts";
import { baseData, mainData, fixtureConnector } from "./helpers/data.ts";

function digest(root: string): string { const hash = createHash("sha256"); const visit = (dir: string) => { for (const item of readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) { const file = path.join(dir, item.name); hash.update(file); if (item.isDirectory()) visit(file); else hash.update(readFileSync(file)); } }; visit(root); return hash.digest("hex"); }
test("supplied templates and minimal main-case fixture pass without modifying source files", () => {
  const before = digest("docs/data-templates");
  expect(checkData(new FileConnector("docs/data-templates")).errors).toBe(0);
  expect(checkData(fixtureConnector(mainData())).errors).toBe(0);
  expect(digest("docs/data-templates")).toBe(before);
});
test("checker reports per-file malformed types, missing references, invalid periods and exact quotes", () => {
  const data = mainData();
  data.records[0].employee_id = "E-9999";
  data.records[0].valid_to = "2000-01-01";
  data.documents[1].assertions[0].quote = "not an exact quote";
  data.cases[0].assigned_to = undefined;
  const checked = checkData(fixtureConnector(data));
  expect(checked.errors).toBeGreaterThan(2);
  expect(formatReport(checked)).toContain("records/REC-0002");
  expect(formatReport(checked)).toContain("Quote not found literally");
  expect(checked.issues.some(i => i.field === "assigned_to" && i.severity === "warn")).toBe(true);
  expect(checkData({ read: () => ({ sources: [{ kind: "clients", file: "broken.json", raw: { id: "bad" } }], issues: [], fileCount: 1 }) }).errors).toBeGreaterThan(0);
  expect(checkData(new FileConnector("tests/fixtures/does-not-exist")).errors).toBe(3);
});
test("normalisation keeps exact quote offsets, stable IDs, origins, and file-order independence", () => {
  const data = mainData(), result = normalize(data);
  for (const a of result.assertions.filter(a => a.origin === "declared")) {
    const doc = data.documents.find(d => d.id === a.sourceId)!;
    expect(doc.body.slice(a.locator.start, a.locator.end)).toBe(a.locator.quote);
    expect(result.fragments.some(f => f.id === a.locator.fragmentId)).toBe(true);
  }
  const shuffled = structuredClone(data); for (const entries of Object.values(shuffled)) entries.reverse();
  expect(checkData(fixtureConnector(shuffled)).dataset).toEqual(checkData(fixtureConnector(data)).dataset);
});
test("ingest is idempotent, keeps operational rows, warns about orphan users, and rolls back failures", () => {
  const db = openDatabase(":memory:"); migrate(db);
  try {
    const base = baseData();
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)").run("u1", "user@example.com", "P-9999", "consultant", "hash");
    db.prepare("INSERT INTO llm_cache VALUES (?, ?)").run("cached", "{}");
    db.prepare("INSERT INTO decisions VALUES (?, ?, ?, ?, ?, ?)").run("d1", "CASE-0001", "u1", "record", "reason", "2026-01-01T00:00:00Z");
    db.prepare("INSERT INTO case_status_events VALUES (?, ?, ?, ?)").run("s1", "CASE-0001", "proposed", "{}");
    const input = fixtureConnector(base);
    const result = ingestData(db, input);
    expect(result.ingested).toBe(true); expect(result.userWarnings[0]).toContain("P-9999");
    const rows = db.prepare("SELECT * FROM assertions ORDER BY id").all();
    ingestData(db, input); expect(db.prepare("SELECT * FROM assertions ORDER BY id").all()).toEqual(rows);
    for (const table of ["users", "llm_cache", "decisions", "case_status_events"]) {
      // Fixed test-only table names; production statements are fixed and prepared.
      expect((db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n).toBe(1);
    }
    const broken = structuredClone(base); broken.records[0].employee_id = "E-9999";
    expect(ingestData(db, fixtureConnector(broken)).ingested).toBe(false);
    expect(db.prepare("SELECT * FROM assertions ORDER BY id").all()).toEqual(rows);
    db.exec("CREATE TRIGGER fail_insert BEFORE INSERT ON clients BEGIN SELECT RAISE(ABORT, 'test failure'); END");
    expect(() => ingestData(db, input)).toThrow("test failure");
    expect(db.prepare("SELECT * FROM assertions ORDER BY id").all()).toEqual(rows);
  } finally { db.close(); }
});
