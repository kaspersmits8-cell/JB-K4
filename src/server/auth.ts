import { randomUUID } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { Repository } from "./repo/index.ts";
import { localLoginEnabled, localUser } from "./local-login.ts";
export const createUserSchema = z.object({ email: z.email(), personId: z.string().regex(/^P-\d{4}$/), role: z.enum(["consultant", "payroll_lead"]), password: z.string().min(12).max(72) });
export async function createUser(repo: Repository, input: unknown) {
  const value = createUserSchema.parse(input);
  const person = repo.personForProvisioning(value.personId);
  if (!person || !person.active || person.organisation !== "SDWORX" || person.role !== value.role) throw new Error("Person must be an active SD Worx consultant or payroll lead with the matching role");
  const id = randomUUID(), passwordHash = await hash(value.password, 12);
  repo.db.prepare("INSERT INTO users (id, email, person_id, role, password_hash) VALUES (?, ?, ?, ?, ?)").run(id, value.email.toLowerCase(), value.personId, value.role, passwordHash);
  return repo.resolveUser(id)!;
}
const dummyHash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxH7fqFWp2LXMoOxczHYbIWXaHe";
export async function authenticate(repo: Repository, email: string, password: string) {
  if (email === "1") return localLoginEnabled() && password === "1" ? localUser() : null;
  const account = repo.accountByEmail(email);
  const matches = await compare(password, account?.password_hash || dummyHash);
  return matches && account ? repo.resolveUser(account.id) : null;
}
