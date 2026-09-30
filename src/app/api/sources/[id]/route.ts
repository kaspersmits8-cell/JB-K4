import { respond } from "../../../../server/http.ts";
import { currentUser } from "../../../../server/session.ts";
import { Repository } from "../../../../server/repo/index.ts";
import { getStorage } from "../../../../server/storage.ts";
import { getSource } from "../../../../server/services/analysis.ts";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return respond(async () => getSource(new Repository(getStorage()), await currentUser(), (await context.params).id)); }
