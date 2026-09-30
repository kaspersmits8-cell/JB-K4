import { FileConnector } from "../src/data/connectors/file.ts";
import { checkData, formatReport } from "../src/data/check.ts";
const result = checkData(new FileConnector(process.env.DATA_DIR || "./data"));
console.log(formatReport(result));
process.exitCode = result.errors ? 1 : 0;
