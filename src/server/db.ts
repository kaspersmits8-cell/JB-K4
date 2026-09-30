import Database from "better-sqlite3";

/** The only driver-specific module. Repositories use this stable adapter. */
export function openDatabase(filename: string) {
  return new Database(filename);
}
export type SqliteDatabase = ReturnType<typeof openDatabase>;
