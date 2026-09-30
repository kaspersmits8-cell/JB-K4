import { expect, test } from "vitest";
import { analysisTime, sessionSecret, storagePaths, validateProvider } from "../src/server/config.ts";
test("DEMO_NOW pins analysis, fallback reads server clock, invalid timestamps fail", () => {
  const fixed = "2026-02-01T09:15:00Z";
  expect(analysisTime({ DEMO_NOW: fixed }, () => { throw new Error("must not read clock"); })).toBe(fixed);
  expect(analysisTime({}, () => new Date(fixed))).toBe("2026-02-01T09:15:00.000Z");
  expect(() => analysisTime({ DEMO_NOW: "tomorrow" })).toThrow();
});
test("configuration protects secrets, provider and dataset write boundary", () => {
  expect(() => sessionSecret({})).toThrow();
  expect(sessionSecret({ SESSION_SECRET: "x".repeat(32) })).toHaveLength(32);
  expect(() => validateProvider({ LLM_PROVIDER: "openrouter" })).toThrow();
  expect(() => storagePaths({ DATA_DIR: "./data", DB_PATH: "./data/test.db" })).toThrow();
  expect(() => storagePaths({ DATA_DIR: "./tests/fixtures", DB_PATH: "./tests/fixtures/test.db" })).toThrow();
  expect(() => storagePaths({ DATA_DIR: "./tests/fixtures", DB_PATH: "./data/test.db" })).toThrow();
  expect(storagePaths({}).dbPath).toContain("trust.db");
});
