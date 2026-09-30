import { FileConnector } from "../src/data/connectors/file.ts";
import { checkData, formatReport } from "../src/data/check.ts";
import { ingestData } from "../src/data/ingest.ts";
import { openStorage } from "../src/server/storage.ts";
const connector = new FileConnector(process.env.DATA_DIR || "./data");
const checked = checkData(connector);
if (checked.errors) { console.log(formatReport(checked)); process.exitCode = 1; }
else {
  const db = openStorage();
  try {
    const result = ingestData(db, connector);
    console.log(formatReport(result));
    for (const warning of result.userWarnings) console.warn(`warn  ${warning}`);
    if (result.ingested) console.log(Object.entries(result.dataset).map(([kind, values]) => `${kind}: ${values.length}`).join(", "));
    process.exitCode = result.ingested ? 0 : 1;
  } finally { db.close(); }
}
