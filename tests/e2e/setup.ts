import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { openStorage } from "../../src/server/storage.ts";
import { Repository } from "../../src/server/repo/index.ts";
import { createUser } from "../../src/server/auth.ts";
import { ingestData } from "../../src/data/ingest.ts";
import { fixtureConnector } from "../helpers/data.ts";
import { flowData } from "../helpers/flow.ts";
// Always use this dedicated disposable database, never the environment's normal DB.
const directory = path.resolve(".local/flow-e2e");
mkdirSync(directory,{recursive:true});
const db = openStorage({DB_PATH:path.join(directory,"trust.db"),DATA_DIR:"tests/fixtures/main"});
try {
  db.exec("DELETE FROM users; DELETE FROM decisions; DELETE FROM case_status_events;");
  const ingested = ingestData(db,fixtureConnector(flowData()));
  if (!ingested.ingested) throw new Error("Guided-flow fixtures failed validation");
  const credentials = {jan:randomBytes(24).toString("hex"),femke:randomBytes(24).toString("hex")};
  const repo = new Repository(db);
  await createUser(repo,{email:"jan@example.com",personId:"P-0001",role:"consultant",password:credentials.jan});
  await createUser(repo,{email:"femke@example.com",personId:"P-0004",role:"consultant",password:credentials.femke});
  writeFileSync(path.join(directory,"credentials.json"),JSON.stringify(credentials),{mode:0o600});
} finally { db.close(); }
