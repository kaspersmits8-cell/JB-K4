import Link from "next/link";
import Form from "next/form";
import type { FlowData } from "../server/services/flow.ts";
import { flowCopy, defaultAsk, shortDate, humanText } from "./copy.ts";
import { flowUrl } from "./flow-query.ts";
import { SourceDrawer, SourceLink } from "./SourceDrawer.tsx";
export function Question({ data }: { data: FlowData }) {
  const a = data.result.analysis, c = a.context.case;
  const ask = data.query.ask ? flowCopy.questions[data.query.ask] || data.query.ask : defaultAsk(c,a.context.employee.name);
  return <><section className="panel stack"><div className="row between wrap"><h1>{flowCopy.message}</h1><p className="muted">{data.presentation.names[c.reporter_id] || flowCopy.personUnknown} · {shortDate(c.opened_at)}</p></div><blockquote className="client-message">{humanText(c.question_text)}</blockquote>{data.presentation.attachments.length > 0 && <div className="stack-tight"><h2>{flowCopy.attachments}</h2><div className="chips">{data.presentation.attachments.map(source => <SourceLink key={source.id} source={source} data={data} step="question" />)}</div></div>}</section>
    <section className="panel stack"><Form action={`/cases/${c.id}/answer`} className="stack"><label>{flowCopy.ask}<textarea className="ask-field" key={ask} name="ask" rows={3} maxLength={300} defaultValue={ask} required /></label><button type="submit" className="primary check-button"><span>{flowCopy.check}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button><p className="muted">{flowCopy.scope}</p></Form><div className="stack-tight"><h2>{flowCopy.suggested}</h2><div className="chips">{a.findings.map(f => <Link className="source-chip" key={f.id} href={flowUrl(c.id,"answer",data.query,{ ask:f.id, source:undefined })}>{flowCopy.questions[f.id] || humanText(f.question)}</Link>)}<Link className="source-chip" href={flowUrl(c.id,"answer",data.query,{ ask:"procedure",tab:"procedure",source:undefined })}>{flowCopy.procedureQuestion}</Link></div></div></section><SourceDrawer data={data} step="question" /></>;
}
