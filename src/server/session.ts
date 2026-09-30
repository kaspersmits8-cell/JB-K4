import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionSecret } from "./config.ts";
import { Repository } from "./repo/index.ts";
import { getStorage } from "./storage.ts";
export async function getSession() {
  return getIronSession<{ userId?: string }>(await cookies(), { password: sessionSecret(), cookieName: "trust-dossier", ttl: 8 * 60 * 60, cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" } });
}
export async function currentUser() {
  const session = await getSession();
  return session.userId ? new Repository(getStorage()).resolveUser(session.userId) : null;
}
