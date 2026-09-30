import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "../../server/session.ts";
import { getStorage } from "../../server/storage.ts";
import { Repository } from "../../server/repo/index.ts";
import { listCases } from "../../server/services/analysis.ts";
import { Logout } from "../../ui/Login.tsx";
import { Setup } from "../../ui/Setup.tsx";
import { copy, displayDate } from "../../ui/copy.ts";
export const dynamic = "force-dynamic";
export default async function CaseInbox() {
  const user = await currentUser(); if (!user) redirect("/login");
  const repo = new Repository(getStorage()), cases = listCases(repo, user);
  return <><header className="topbar"><Link href="/cases" className="brand">{copy.app}</Link><div className="row"><span>{user.email}</span><Logout /></div></header><main className="shell stack"><div><p className="eyebrow">{copy.tagline}</p><h1>{copy.cases}</h1></div>{cases.length ? <section className="panel table-wrap"><table><caption>{copy.openCases}</caption><thead><tr><th>{copy.client}</th><th>{copy.employee}</th><th>{copy.question}</th><th>{copy.received}</th><th>{copy.status}</th></tr></thead><tbody>{cases.map(c => <tr key={c.id}><td>{c.client.name}</td><td><Link href={`/cases/${c.id}`}>{c.employee.name}</Link></td><td><Link href={`/cases/${c.id}`}>{c.question_text}</Link></td><td>{displayDate(c.opened_at)}</td><td>{c.status}</td></tr>)}</tbody></table></section> : repo.hasData() ? <section className="panel"><h2>{copy.empty}</h2><p>{copy.emptyScope}</p></section> : <Setup />}</main></>;
}
