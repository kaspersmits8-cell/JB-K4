import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { SqliteDatabase } from "../src/server/db.ts";
import type { User } from "../src/server/repo/index.ts";
const context = vi.hoisted(() => ({ db: null as unknown as SqliteDatabase, user: null as User | null }));
vi.mock("../src/server/storage.ts", async original => ({ ...await original<typeof import("../src/server/storage.ts")>(), getStorage: () => context.db }));
vi.mock("../src/server/session.ts", () => ({ currentUser: async () => context.user }));
import { openDatabase } from "../src/server/db.ts";
import { migrate } from "../src/server/storage.ts";
import { Repository } from "../src/server/repo/index.ts";
import { ingestData } from "../src/data/ingest.ts";
import { fixtureConnector, mainData } from "./helpers/data.ts";
import { GET as cases } from "../src/app/api/cases/route.ts";
import { GET as analysis } from "../src/app/api/cases/[id]/analysis/route.ts";
import { GET as source } from "../src/app/api/sources/[id]/route.ts";
import { POST as decide } from "../src/app/api/cases/[id]/decisions/route.ts";
import { getAnalysis } from "../src/server/services/analysis.ts";
import { recordDecision } from "../src/server/services/decisions.ts";
import { respond } from "../src/server/http.ts";
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (url: string) => new Request(`http://localhost${url}`);
const post = (body: unknown, origin = "http://localhost") => new Request("http://localhost/api/cases/CASE-0001/decisions", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  context.db = openDatabase(":memory:"); migrate(context.db); ingestData(context.db, fixtureConnector(mainData()));
  const insert = context.db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
  insert.run("u1", "jan@example.com", "P-0001", "consultant", "test-only"); insert.run("u2", "lead@example.com", "P-0002", "payroll_lead", "test-only"); insert.run("u3", "lead.two@example.com", "P-0005", "payroll_lead", "test-only");
  context.user = new Repository(context.db).resolveUser("u1"); vi.stubEnv("LLM_PROVIDER", "mock");
});
afterEach(() => { context.db.close(); vi.unstubAllEnvs(); });
test("real API handlers enforce anonymous, scoped and foreign case/source responses", async () => {
  context.user = null; expect((await cases()).status).toBe(401);
  context.user = new Repository(context.db).resolveUser("u1");
  expect((await cases()).status).toBe(200);
  expect((await analysis(request("/api/cases/CASE-0002/analysis"), params("CASE-0002"))).status).toBe(404);
  expect((await source(request("/api/sources/REC-9999"), params("REC-9999"))).status).toBe(404);
  expect((await analysis(request("/api/cases/CASE-0001/analysis?exclude=REC-9999"), params("CASE-0001"))).status).toBe(400);
  expect((await analysis(request("/api/cases/CASE-0001/analysis?exclude=REC-0002&exclude=REC-0004"), params("CASE-0001"))).status).toBe(400);
  expect((await analysis(request("/api/cases/bad/analysis"), params("bad"))).status).toBe(400);
});
test("DEMO_NOW is identical in the API and baseline/what-if; fallback captures the clock once", async () => {
  vi.stubEnv("DEMO_NOW", "2026-02-01T09:15:00Z");
  const response = await analysis(request("/api/cases/CASE-0001/analysis?exclude=REC-0002"), params("CASE-0001"));
  const body = await response.json(); expect(body.analysis.asOf).toBe("2026-02-01T09:15:00Z"); expect(body.demoClock).toBe(true); expect(body.diff.findings[0].after.state).toBe("INDICATION");
  expect(response.headers.get("cache-control")).toBe("no-store");
  const now = vi.fn(() => new Date("2026-03-01T12:00:00Z"));
  const output = getAnalysis(new Repository(context.db), context.user, "CASE-0001", "REC-0002", {}, now);
  expect(now).toHaveBeenCalledTimes(1); expect(output.analysis.asOf).toBe("2026-03-01T12:00:00.000Z"); expect(output.demoClock).toBe(false);
});
test("correction state machine rejects skipped steps, consultant approval and self approval", async () => {
  const repo = new Repository(context.db), jan = repo.resolveUser("u1")!, lead = repo.resolveUser("u2")!, lead2 = repo.resolveUser("u3")!;
  const action = (actor: User, name: string) => recordDecision(repo, actor, "CASE-0001", { action: name, rationale: "Reviewed evidence" });
  for (const name of ["mark_executed", "confirm_outcome"]) expect(() => action(jan, name)).toThrow("invalid_transition");
  action(lead, "propose_correction"); expect(() => action(lead, "approve_correction")).toThrow("approval_not_allowed"); expect(() => action(jan, "approve_correction")).toThrow("approval_not_allowed");
  expect(() => action(jan, "mark_executed")).toThrow("invalid_transition");
  action(lead2, "approve_correction"); expect(() => action(jan, "confirm_outcome")).toThrow("invalid_transition");
  action(jan, "mark_executed"); action(jan, "confirm_outcome");
  expect(repo.status(jan, "CASE-0001")?.stage).toBe("confirmed"); expect(() => action(jan, "confirm_outcome")).toThrow("invalid_transition");
  expect(repo.decisions(jan, "CASE-0001")).toHaveLength(4);
});
test("decision endpoint derives actor/time server-side, validates rationale and origin", async () => {
  vi.stubEnv("DEMO_NOW", "2000-01-01T00:00:00Z");
  expect((await decide(post({ action: "record", rationale: "" }), params("CASE-0001"))).status).toBe(400);
  expect((await decide(post({ action: "record", rationale: "Reason", actor_id: "u2" }), params("CASE-0001"))).status).toBe(400);
  expect((await decide(post({ action: "record", rationale: "Reason" }, "http://evil.example"), params("CASE-0001"))).status).toBe(403);
  const before = Date.now();
  const response = await decide(post({ action: "record", rationale: "Reason" }), params("CASE-0001"));
  expect(response.status).toBe(201); const body = await response.json(); expect(body.decision.actor_id).toBe("u1"); expect(Date.parse(body.decision.at)).toBeGreaterThanOrEqual(before);
});
test("deleted person and unsupported role invalidate even a previously valid API session", async () => {
  context.db.prepare("DELETE FROM people WHERE id = ?").run("P-0001"); expect((await cases()).status).toBe(401);
  ingestData(context.db, fixtureConnector(mainData())); expect((await cases()).status).toBe(200);
  context.db.prepare("UPDATE users SET role = ? WHERE id = ?").run("expert", "u1"); expect((await cases()).status).toBe(401);
});
test("unexpected errors expose only a generic code and tracking ID", async () => {
  const response = await respond(() => { throw new Error("secret-stack-information"); });
  expect(response.status).toBe(500); const text = await response.text(); expect(text).not.toContain("secret-stack-information"); expect(JSON.parse(text)).toMatchObject({ error: "server_error", id: expect.any(String) });
});
