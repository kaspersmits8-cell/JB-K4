import { afterEach, expect, test, vi } from "vitest";
import { openDatabase } from "../src/server/db.ts";
import { migrate } from "../src/server/storage.ts";
import { Repository } from "../src/server/repo/index.ts";
import { authenticate } from "../src/server/auth.ts";
import { localUserId } from "../src/server/local-login.ts";
import { ingestData } from "../src/data/ingest.ts";
import { fixtureConnector, mainData } from "./helpers/data.ts";

afterEach(() => vi.unstubAllEnvs());

test("local credentials open an empty inbox without granting dataset access", async () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("LOCAL_DEMO_LOGIN", "true");
  const db = openDatabase(":memory:"); migrate(db);
  try {
    const repo = new Repository(db);
    const user = await authenticate(repo, "1", "1");
    expect(user?.id).toBe(localUserId);
    expect(repo.resolveUser(user!.id)).toEqual(user);
    expect(repo.cases(user!)).toEqual([]);
    expect(await authenticate(repo, "1", "wrong")).toBeNull();
    ingestData(db, fixtureConnector(mainData()));
    expect(repo.clients(user!)).toEqual([]);
    expect(repo.cases(user!)).toEqual([]);
    expect(repo.sources(user!)).toEqual([]);
    expect(repo.experts(user!)).toEqual([]);
    expect(repo.precedents(user!)).toEqual([]);
    expect(repo.getCase(user!, "CASE-0001")).toBeNull();
    expect(repo.accountByEmail("1")).toBeUndefined();
    vi.stubEnv("LOCAL_DEMO_LOGIN", "false");
    expect(await authenticate(repo, "1", "1")).toBeNull();
    expect(repo.resolveUser(user!.id)).toBeNull();
  } finally { db.close(); }
});

test.each(["production", "test", undefined])("preview credentials and sessions fail outside development (%s)", async environment => {
  vi.stubEnv("NODE_ENV", environment); vi.stubEnv("LOCAL_DEMO_LOGIN", "true");
  const db = openDatabase(":memory:"); migrate(db);
  try {
    const repo = new Repository(db);
    expect(await authenticate(repo, "1", "1")).toBeNull();
    expect(repo.resolveUser(localUserId)).toBeNull();
  } finally { db.close(); }
});
