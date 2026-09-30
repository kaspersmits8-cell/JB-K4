import { sessionSecret, analysisTime, validateProvider, storagePaths } from "./config.ts";
import { getStorage } from "./storage.ts";
export function startServer() {
  try {
    sessionSecret();
    analysisTime();
    validateProvider();
    storagePaths();
    getStorage();
  } catch {
    console.error("Startup refused: check SESSION_SECRET (32+ characters), DEMO_NOW, LLM_PROVIDER=mock, and the database path/permissions.");
    process.exit(1);
  }
}
