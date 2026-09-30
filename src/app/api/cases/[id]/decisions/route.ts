import { respond, verifyOrigin, jsonBody } from "../../../../../server/http.ts";
import { currentUser } from "../../../../../server/session.ts";
import { Repository } from "../../../../../server/repo/index.ts";
import { getStorage } from "../../../../../server/storage.ts";
import { recordDecision } from "../../../../../server/services/decisions.ts";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { return respond(async () => { verifyOrigin(request); return recordDecision(new Repository(getStorage()), await currentUser(), (await context.params).id, await jsonBody(request)); }, 201); }
