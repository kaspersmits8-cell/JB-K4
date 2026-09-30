import { test } from "vitest";
import { openDatabase } from "../src/server/db.ts";
import { verifySqlite } from "./helpers/sqlite.ts";
test("SQLite prepared statements, commit and rollback", () => {
  const db = openDatabase(":memory:");
  try { verifySqlite(db); } finally { db.close(); }
});
