import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: false, workers: 1, timeout: 90000,
  use: { baseURL: "http://127.0.0.1:3115", viewport: { width: 1440, height: 1000 }, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: {
    command: "node tests/e2e/setup.ts && npm run start -- --hostname 127.0.0.1 --port 3115",
    url: "http://127.0.0.1:3115/login", reuseExistingServer: false, timeout: 60000,
    env: { SESSION_SECRET: randomBytes(32).toString("hex"), DB_PATH: "./.local/flow-e2e/trust.db", DATA_DIR: "./tests/fixtures/main", LLM_PROVIDER: "mock", DEMO_NOW: "2026-02-03T09:00:00Z", LOCAL_DEMO_LOGIN: "false" },
  },
});
