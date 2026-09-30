"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "./copy.ts";
export function Login({ localLogin = false }: { localLogin?: boolean }) {
  const router = useRouter(), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordId = useId();
  return <form className="stack" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try { const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) }); if (!response.ok) throw new Error(); router.push("/cases"); router.refresh(); }
    catch { setError(copy.loginError); } finally { setBusy(false); }
  }}>
    <label>{localLogin ? copy.usernameOrEmail : copy.email}<input name="email" type={localLogin ? "text" : "email"} required autoComplete="username" maxLength={254} /></label>
    <div>
      <label htmlFor={passwordId}>{copy.password}</label>
      <div className="password-control">
        <input id={passwordId} name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" maxLength={72} />
        <button type="button" aria-controls={passwordId} onClick={() => setShowPassword(visible => !visible)}>{showPassword ? copy.hidePassword : copy.showPassword}</button>
      </div>
    </div>
    {error && <p role="alert" className="error-text">{error}</p>}
    <button className="primary" disabled={busy}>{busy ? copy.signingIn : copy.signIn}</button>
  </form>;
}
export function Logout() { const router = useRouter(); return <button onClick={async () => { const response = await fetch("/api/auth/logout", { method: "POST" }); if (response.ok) { router.push("/login"); router.refresh(); } }}>{copy.signOut}</button>; }
