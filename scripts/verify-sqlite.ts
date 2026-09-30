import { openDatabase } from "../src/server/db.ts";
import { verifySqlite } from "../tests/helpers/sqlite.ts";
const db = openDatabase(":memory:");
try { verifySqlite(db); console.log(`SQLite verified: better-sqlite3 on ${process.platform} ${process.version}`); }
finally { db.close(); }
