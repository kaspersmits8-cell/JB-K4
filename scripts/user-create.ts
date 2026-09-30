import { emitKeypressEvents } from "node:readline";
import { parseArgs } from "node:util";
import { createUser } from "../src/server/auth.ts";
import { Repository } from "../src/server/repo/index.ts";
import { openStorage } from "../src/server/storage.ts";
const { values } = parseArgs({ options: { email: { type: "string" }, person: { type: "string" }, role: { type: "string" } }, strict: true });
function promptPassword(label: string): Promise<string> {
  if (!process.stdin.isTTY) throw new Error("Run user:create in an interactive terminal; passwords cannot be supplied as arguments or pipes.");
  process.stdout.write(label); emitKeypressEvents(process.stdin); process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let password = "";
    const finish = () => { process.stdin.setRawMode(false); process.stdin.off("keypress", listener); process.stdin.pause(); process.stdout.write("\n"); };
    const listener = (text: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") { finish(); reject(new Error("Cancelled")); }
      else if (key.name === "return") { finish(); resolve(password); }
      else if (key.name === "backspace") password = password.slice(0, -1);
      else if (text && !key.ctrl && !text.includes("\u001b")) password += text;
    };
    process.stdin.on("keypress", listener);
  });
}
try {
  const password = await promptPassword("Password (12–72 characters; hidden): ");
  if (password !== await promptPassword("Repeat password: ")) throw new Error("Passwords do not match");
  const db = openStorage();
  try { const user = await createUser(new Repository(db), { email: values.email, personId: values.person, role: values.role, password }); console.log(`Created ${user.role} login ${user.email}`); }
  finally { db.close(); }
} catch (error) { console.error(error instanceof Error ? error.message : "Unable to create user"); process.exitCode = 1; }
