import path from "node:path";
import { realpathSync, existsSync } from "node:fs";
import { z } from "zod";

export function analysisTime(env: Record<string, string | undefined> = process.env, now: () => Date = () => new Date()): string {
  if (env.DEMO_NOW) return z.iso.datetime({ offset: true }).parse(env.DEMO_NOW);
  return now().toISOString();
}

export function sessionSecret(env: Record<string, string | undefined> = process.env): string {
  return z.string().min(32, "SESSION_SECRET must contain at least 32 characters").parse(env.SESSION_SECRET);
}

export function validateProvider(env: Record<string, string | undefined> = process.env) {
  if ((env.LLM_PROVIDER || "mock") !== "mock") throw new Error("Milestone 1 supports LLM_PROVIDER=mock only");
}

function canonicalPath(input: string): string {
  const absolute = path.resolve(input);
  if (existsSync(absolute)) return realpathSync(absolute);
  const parent = path.dirname(absolute);
  return parent === absolute ? absolute : path.join(canonicalPath(parent), path.basename(absolute));
}

export function storagePaths(env: Record<string, string | undefined> = process.env) {
  const dataDir = canonicalPath(env.DATA_DIR || "./data");
  const dbPath = canonicalPath(env.DB_PATH || "./.local/trust.db");
  for (const protectedDir of [dataDir, canonicalPath("./data")]) {
    const relative = path.relative(protectedDir, dbPath);
    if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
      throw new Error("DB_PATH must be outside data/ and DATA_DIR");
    }
  }
  return { dataDir, dbPath };
}
