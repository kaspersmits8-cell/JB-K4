import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../server/session.ts";
import { getStorage } from "../../server/storage.ts";
import { Repository } from "../../server/repo/index.ts";
import { listCases } from "../../server/services/analysis.ts";
import { analysisTime } from "../../server/config.ts";
import { Logout } from "../../ui/Login.tsx";
import { Setup } from "../../ui/Setup.tsx";
import { copy, flowCopy, humanText, relativeReceived, shortDate } from "../../ui/copy.ts";
import { Logo } from "../../ui/Logo.tsx";
export const dynamic = "force-dynamic";
export default async function CaseInbox() {
  const user = await currentUser(); if (!user) redirect("/login");
  const repo = new Repository(getStorage()), asOf = analysisTime();
  const cases = listCases(repo,user).sort((a,b) => (a.deadline || "9999").localeCompare(b.deadline || "9999") || a.opened_at.localeCompare(b.opened_at));
  return <><header className="topbar"><Link href="/cases" className="brand"><Logo /></Link><Logout /></header><main className="shell flow-shell stack"><div><p className="eyebrow">{copy.tagline}</p><h1>{copy.cases}</h1></div>{cases.length ? <div className="inbox-cards">{cases.map(c => {
    const decisions = repo.decisions(user,c.id) || [], stage = repo.status(user,c.id)?.stage;
    const status = c.status === "closed" ? flowCopy.inboxStates.closed : stage && stage !== "none" ? flowCopy.inboxStates.proposed : decisions.at(-1)?.action === "request_confirmation" ? flowCopy.inboxStates.waiting : decisions.length ? flowCopy.inboxStates.progress : flowCopy.inboxStates.new;
    return <Link href={`/cases/${c.id}`} className="panel inbox-card stack-tight" key={c.id}><div className="row between wrap"><h2>{c.employee.name}</h2><span className="chip">{status}</span></div><p className="muted">{c.client.name}</p><p>{humanText(c.question_text.split(/(?<=[.!?])\s/)[0])}</p><div className="row between wrap small"><span>{copy.received} {relativeReceived(c.opened_at,asOf)}</span>{c.deadline && <span>{flowCopy.due} {shortDate(c.deadline)}</span>}</div></Link>;
  })}</div> : repo.hasData() ? <section className="panel"><h2>{copy.empty}</h2><p>{copy.emptyScope}</p></section> : <Setup />}</main></>;
}
