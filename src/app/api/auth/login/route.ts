import { z } from "zod";
import { respond, verifyOrigin, jsonBody } from "../../../../server/http.ts";
import { getSession } from "../../../../server/session.ts";
import { Repository } from "../../../../server/repo/index.ts";
import { getStorage } from "../../../../server/storage.ts";
import { authenticate } from "../../../../server/auth.ts";
import { AppError } from "../../../../server/errors.ts";
import { loginLimit } from "../../../../server/rate-limit.ts";
import { localLoginEnabled } from "../../../../server/local-login.ts";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return respond(async () => {
    verifyOrigin(request);
    const identifier = localLoginEnabled() ? z.union([z.email().max(254), z.literal("1")]) : z.email().max(254);
    const input = z.object({ email: identifier, password: z.string().min(1).max(72) }).strict().parse(await jsonBody(request));
    // The shared email budget cannot be bypassed by spoofing a forwarded address.
    loginLimit.check("all-addresses", input.email);
    loginLimit.check(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || "local", input.email);
    const user = await authenticate(new Repository(getStorage()), input.email, input.password);
    if (!user) throw new AppError(401, "invalid_credentials");
    const session = await getSession(); session.destroy(); session.userId = user.id; await session.save();
    return { ok: true };
  });
}
