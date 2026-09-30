import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "./errors.ts";
export async function respond(action: () => unknown | Promise<unknown>, status = 200) {
  try { return Response.json(await action(), { status, headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    const status = error instanceof AppError ? error.status : error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 500;
    const code = error instanceof AppError ? error.code : status === 400 ? "invalid_input" : "server_error";
    const id = randomUUID();
    if (status === 500) console.error(JSON.stringify({ event: "request_failed", id, code }));
    return Response.json({ error: code, id }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
export function verifyOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new AppError(403, "invalid_origin");
}
export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AppError(400, "invalid_input");
  if (Number(request.headers.get("content-length") || 0) > 16000) throw new AppError(413, "request_too_large");
  const reader = request.body?.getReader(); if (!reader) throw new AppError(400, "invalid_input");
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 16000) { await reader.cancel(); throw new AppError(413, "request_too_large"); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
