import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { openDatabase } from "./db.ts";
import type { SqliteDatabase } from "./db.ts";
import { storagePaths } from "./config.ts";
export function migrate(db: SqliteDatabase) {
  db.exec("CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)");
  const directory = path.join(process.cwd(), "src/data/migrations");
  for (const name of readdirSync(directory).filter(n => n.endsWith(".sql")).sort()) {
    if (db.prepare("SELECT name FROM migrations WHERE name = ?").get(name)) continue;
    db.transaction(() => { db.exec(readFileSync(path.join(directory, name), "utf8")); db.prepare("INSERT INTO migrations (name) VALUES (?)").run(name); })();
  }
}
export function openStorage(env: Record<string, string | undefined> = process.env) {
  const { dbPath } = storagePaths(env);
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = openDatabase(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}
let shared: SqliteDatabase | undefined;
export function getStorage() { return shared ??= openStorage(); }
