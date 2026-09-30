import assert from "node:assert/strict";
import type { SqliteDatabase } from "../../src/server/db.ts";
export function verifySqlite(db: SqliteDatabase) {
  db.exec("CREATE TABLE driver_check (value TEXT NOT NULL)");
  const insert = db.prepare("INSERT INTO driver_check (value) VALUES (?)");
  db.transaction(() => insert.run("committed"))();
  assert.throws(() => db.transaction(() => { insert.run("rolled back"); throw new Error("rollback"); })());
  assert.deepEqual(db.prepare("SELECT value FROM driver_check").all(), [{ value: "committed" }]);
}
