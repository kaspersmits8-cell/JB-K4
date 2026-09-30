"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FlowData } from "../server/services/flow.ts";
import type { Source } from "../data/normalized.ts";
import { flowUrl, type Step } from "./flow-query.ts";
import { copy, flowCopy, sourceName, shortDate, dateRange, vocabularyText, humanText } from "./copy.ts";
export function SourceLink({ source, data, step }: { source: Source; data: FlowData; step: Step }) {
  return <Link className="source-chip" scroll={false} href={flowUrl(data.result.analysis.context.case.id,step,data.query,{ source: source.id })}>{humanText(sourceName(source))}</Link>;
}
export function Highlight({ text, quotes }: { text: string; quotes: string[] }) {
  const ranges = quotes.filter(Boolean).flatMap(quote => { const start = text.indexOf(quote); return start < 0 ? [] : [{ start, end: start + quote.length }]; }).sort((a,b) => a.start-b.start);
  let end = 0; const pieces: React.ReactNode[] = [];
  for (const range of ranges) { if (range.start < end) continue; pieces.push(text.slice(end,range.start), <mark key={range.start}>{text.slice(range.start,range.end)}</mark>); end = range.end; }
  pieces.push(text.slice(end)); return <div className="source-body">{pieces}</div>;
}
export function SourceDrawer({ data, step }: { data: FlowData; step: Step }) {
  const dialog = useRef<HTMLDialogElement>(null), router = useRouter();
  const source = data.query.source ? data.presentation.sourceNames[data.query.source] : undefined;
  useEffect(() => { if (source) dialog.current?.showModal(); else dialog.current?.close(); },[source]);
  const close = () => { if (data.query.source) router.replace(flowUrl(data.result.analysis.context.case.id,step,data.query,{ source: undefined }),{ scroll:false }); };
  return <dialog ref={dialog} className="source-dialog" aria-labelledby="source-title" onClose={close}><div className="stack"><div className="row between"><h2 id="source-title">{source ? sourceName(source) : copy.sources}</h2><button autoFocus onClick={() => dialog.current?.close()}>{copy.close}</button></div>{source && <>
    <p className="identifier">{source.id}</p><dl className="metadata"><dt>{copy.sourceType}</dt><dd>{flowCopy.sourceTypes[source.data.type]}</dd><dt>{copy.owner}</dt><dd>{source.kind === "record" ? source.data.system : data.presentation.names[source.data.owner || ""] || copy.noOwner}</dd><dt>{copy.status}</dt><dd>{vocabularyText("statuses",source.data.status)}</dd>{source.kind === "document" && source.data.version && <><dt>{copy.version}</dt><dd>{source.data.version}</dd></>}{dateRange(source.data.valid_from,source.data.valid_to) && <><dt>{copy.validity}</dt><dd>{dateRange(source.data.valid_from,source.data.valid_to)}</dd></>}<dt>{copy.knownAt}</dt><dd>{shortDate(source.data.known_at)}</dd><dt>{copy.visibility}</dt><dd>{vocabularyText("visibility",source.data.visibility)}</dd></dl>
    {source.kind === "document" ? <Highlight text={source.data.body} quotes={source.data.assertions.map(a => a.quote)} /> : <><table><thead><tr><th>{copy.field}</th><th>{copy.value}</th></tr></thead><tbody>{source.data.facts.map((fact,i) => <tr key={i}><td>{vocabularyText("attributes",fact.attribute)}</td><td>{String(fact.value)}</td></tr>)}</tbody></table>{source.data.note && <p className="source-body">{source.data.note}</p>}</>}
  </>}</div></dialog>;
}
