import { z } from "zod";
import { respond } from "../../../../../server/http.ts";
import { currentUser } from "../../../../../server/session.ts";
import { Repository } from "../../../../../server/repo/index.ts";
import { getStorage } from "../../../../../server/storage.ts";
import { getAnalysis } from "../../../../../server/services/analysis.ts";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const query = new URL(request.url).searchParams;
    const excludes = z.array(z.string()).max(1).parse(query.getAll("exclude"));
    return getAnalysis(new Repository(getStorage()), await currentUser(), (await context.params).id, excludes[0] || "");
  });
}
