import Link from "next/link";
import type { FlowData } from "../server/services/flow.ts";
import { copy, flowCopy, periodText, money, shortDate } from "./copy.ts";
import { flowUrl, type Step } from "./flow-query.ts";
import { Logout } from "./Login.tsx";
import { Logo } from "./Logo.tsx";
export function FlowFrame({ data, step, children }: { data: FlowData; step: Step; children: React.ReactNode }) {
  const a = data.result.analysis, c = a.context.case;
  return <><header className="topbar"><Link href="/cases" className="brand"><Logo /></Link><div className="row"><Link href="/cases" className="inbox-link" aria-label={flowCopy.backToInbox} title={flowCopy.backToInbox}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></svg></Link><Logout /></div></header>
    <main className="shell flow-shell stack"><nav className="stepper" aria-label={flowCopy.stepper}>{(Object.keys(flowCopy.steps) as Step[]).map((key,i) => <Link key={key} href={flowUrl(c.id,key,data.query,{ source: undefined })} aria-current={step === key ? "step" : undefined}><span aria-hidden="true">{i+1}</span>{flowCopy.steps[key]}</Link>)}</nav>
      <p className="context-bar">{a.context.client.name} · {a.context.employee.name} · {periodText(c)}{c.reported && <> · {flowCopy.reported}: {c.reported.expected_amount !== undefined ? money(c.reported.expected_amount) : "—"} → {c.reported.received_amount !== undefined ? money(c.reported.received_amount) : "—"} {copy[c.reported.basis]}</>}{c.deadline && <> · {flowCopy.due} {shortDate(c.deadline)}</>} <span className="muted">· {flowCopy.asOf} {shortDate(a.asOf)}</span></p>
      {children}
    </main></>;
}
