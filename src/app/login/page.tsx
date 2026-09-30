import { redirect } from "next/navigation";
import { currentUser } from "../../server/session.ts";
import { getStorage } from "../../server/storage.ts";
import { Repository } from "../../server/repo/index.ts";
import { Login } from "../../ui/Login.tsx";
import { Setup } from "../../ui/Setup.tsx";
import { copy } from "../../ui/copy.ts";
import { localLoginEnabled } from "../../server/local-login.ts";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await currentUser()) redirect("/cases");
  const hasData = new Repository(getStorage()).hasData();
  const localLogin = localLoginEnabled();
  return <main className="login-shell"><div className="brand">{copy.app}</div><section className="panel stack"><p className="eyebrow">{copy.tagline}</p><h1>{copy.signIn}</h1><p className="muted">{localLogin ? copy.localLoginHint : copy.loginHint}</p><Login localLogin={localLogin} /></section>{!hasData && <Setup />}</main>;
}
