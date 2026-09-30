import { respond, verifyOrigin } from "../../../../server/http.ts";
import { getSession } from "../../../../server/session.ts";
export async function POST(request: Request) { return respond(async () => { verifyOrigin(request); const session = await getSession(); session.destroy(); return { ok: true }; }); }
