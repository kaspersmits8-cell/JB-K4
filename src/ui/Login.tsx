"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "./copy.ts";
export function Login({ localLogin = false }: { localLogin?: boolean }) {
  const router = useRouter(), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <form className="stack" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try { const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) }); if (!response.ok) throw new Error(); router.push("/cases"); router.refresh(); }
    catch { setError(copy.loginError); } finally { setBusy(false); }
  }}>
    <label>{localLogin ? copy.usernameOrEmail : copy.email}<input name="email" type={localLogin ? "text" : "email"} required autoComplete="username" maxLength={254} /></label>
    <label>{copy.password}<input name="password" type="password" required autoComplete="current-password" maxLength={72} /></label>
    {error && <p role="alert" className="error-text">{error}</p>}
    <button className="primary" disabled={busy}>{busy ? copy.signingIn : copy.signIn}</button>
  </form>;
}
export function Logout() { const router = useRouter(); return <button onClick={async () => { const response = await fetch("/api/auth/logout", { method: "POST" }); if (response.ok) { router.push("/login"); router.refresh(); } }}>{copy.signOut}</button>; }
