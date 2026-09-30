import Link from "next/link";
import type { FlowData } from "../server/services/flow.ts";
import { copy, flowCopy, periodText, money, shortDate } from "./copy.ts";
import { flowUrl, type Step } from "./flow-query.ts";
import { Logout } from "./Login.tsx";
import { Logo } from "./Logo.tsx";
export function FlowFrame({ data, step, children }: { data: FlowData; step: Step; children: React.ReactNode }) {
  const a = data.result.analysis, c = a.context.case;
  return <><header className="topbar"><Link href="/cases" className="brand"><Logo /></Link><div className="row"><Link href="/cases">{copy.back}</Link><Logout /></div></header>
    <main className="shell flow-shell stack"><nav className="stepper" aria-label={flowCopy.stepper}>{(Object.keys(flowCopy.steps) as Step[]).map((key,i) => <Link key={key} href={flowUrl(c.id,key,data.query,{ source: undefined })} aria-current={step === key ? "step" : undefined}><span aria-hidden="true">{i+1}</span>{flowCopy.steps[key]}</Link>)}</nav>
      <p className="context-bar">{a.context.client.name} · {a.context.employee.name} · {periodText(c)}{c.reported && <> · {flowCopy.reported}: {c.reported.expected_amount !== undefined ? money(c.reported.expected_amount) : "—"} → {c.reported.received_amount !== undefined ? money(c.reported.received_amount) : "—"} {copy[c.reported.basis]}</>}{c.deadline && <> · {flowCopy.due} {shortDate(c.deadline)}</>} <span className="muted">· {flowCopy.asOf} {shortDate(a.asOf)}</span></p>
      {children}
    </main></>;
}
