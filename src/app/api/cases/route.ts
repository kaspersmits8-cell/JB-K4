import { respond } from "../../../server/http.ts";
import { currentUser } from "../../../server/session.ts";
import { Repository } from "../../../server/repo/index.ts";
import { getStorage } from "../../../server/storage.ts";
import { listCases } from "../../../server/services/analysis.ts";
export const runtime = "nodejs";
export async function GET() { return respond(async () => listCases(new Repository(getStorage()), await currentUser())); }
