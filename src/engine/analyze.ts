import type { FactValue } from "../data/schemas.ts";
import type { Source } from "../data/normalized.ts";
import type { Analysis, AnalysisDiff, Check, EngineInput, EvidenceRef, Finding, MatchRule } from "./types.ts";
import { applicability } from "./applicability.ts";
import { regimeExplainsPaidAmount } from "./derivations.ts";
export const equalValue = (a: FactValue | null, b: FactValue | null) => typeof a === "string" && typeof b === "string" ? a.trim().toLowerCase() === b.trim().toLowerCase() : a === b;
const matches = (source: Source, rule: MatchRule) => source.kind === rule.kind && rule.types.includes(source.data.type) && (!rule.statuses || rule.statuses.includes(source.data.status));
function classify(source: Source, check: Check) {
  const reasons: string[] = [];
  const owned = source.kind === "record" || Boolean(source.data.owner);
  if (!owned) reasons.push("ownerless_document");
  if (source.data.status === "unverified") reasons.push("unverified_source");
  if (check.authoritative.some(rule => matches(source, rule)) && owned) return { group: "authoritative" as const, reasons: [...reasons, "authoritative_for_question"] };
  if (check.authoritative.some(rule => rule.kind === source.kind && rule.types.includes(source.data.type))) reasons.push("status_not_authoritative");
  if (check.supporting.some(rule => matches(source, rule))) return { group: "supporting" as const, reasons: [...reasons, "supporting_for_question"] };
  return { group: "ignored" as const, reasons: [...reasons, "not_evidence_for_question"] };
}
export function analyzeCase(input: EngineInput): Analysis {
  const sources = [...input.sources].sort((a,b) => a.id.localeCompare(b.id));
  const sourceMap = new Map(sources.map(source => [source.id, source]));
  const roots = (id: string, visited = new Set<string>()): string[] => {
    if (visited.has(id)) return [id];
    const source = sourceMap.get(id);
    return source?.kind === "record" && source.data.derived_from.length ? source.data.derived_from.flatMap(parent => roots(parent, new Set([...visited, id]))).sort() : [id];
  };
  const evidenceIndex: Analysis["evidenceIndex"] = {};
  for (const assertion of [...input.assertions].sort((a,b) => a.id.localeCompare(b.id))) {
    const source = sourceMap.get(assertion.sourceId);
    if (!source) continue;
    const origin = roots(source.id);
    evidenceIndex[assertion.id] = { assertion, source, sameOriginAs: sources.filter(other => other.id !== source.id && roots(other.id).some(root => origin.includes(root))).map(other => other.id) };
  }
  const current = new Date(input.asOf).toISOString().slice(0, 10);
  const findings: Finding[] = input.playbook.checks.map(check => {
    const finding: Finding = { id: check.id, question: check.question, attribute: check.attribute, state: "INSUFFICIENT", value: null, reasons: [], authoritative: [], supporting: [], contradicting: [], ignored: [], notApplicable: [] };
    const period = check.period === "current" ? { from: current, to: current } : input.case.disputed_period;
    for (const { assertion, source } of Object.values(evidenceIndex)) {
      if (assertion.attribute !== check.attribute || assertion.subjectId !== input.employee.id) continue;
      const reasons = applicability(source, input, period, { from: assertion.validFrom, to: assertion.validTo });
      if (reasons.length) { finding.notApplicable.push({ evidenceId: assertion.id, reasons }); continue; }
      const classified = classify(source, check); finding[classified.group].push({ evidenceId: assertion.id, reasons: classified.reasons });
    }
    const dedup = (refs: EvidenceRef[]) => refs.filter((ref, index) => !refs.slice(0,index).some(prev => {
      const a = evidenceIndex[ref.evidenceId], b = evidenceIndex[prev.evidenceId];
      return equalValue(a.assertion.value, b.assertion.value) && roots(a.source.id).some(root => roots(b.source.id).includes(root));
    }));
    const authoritative = dedup(finding.authoritative), supporting = dedup(finding.supporting);
    const counted = authoritative.length ? authoritative : supporting;
    if (!counted.length) finding.reasons.push("no_applicable_evidence");
    else if (counted.some(ref => !equalValue(evidenceIndex[ref.evidenceId].assertion.value, evidenceIndex[counted[0].evidenceId].assertion.value))) { finding.state = "CONFLICTING"; finding.reasons.push(authoritative.length ? "conflicting_authorities" : "conflicting_support"); }
    else {
      finding.state = authoritative.length ? "SUPPORTED" : "INDICATION"; finding.value = evidenceIndex[counted[0].evidenceId].assertion.value; finding.reasons.push(authoritative.length ? "authoritative_agreement" : "support_only");
      if (authoritative.length) {
        finding.contradicting = finding.supporting.filter(ref => !equalValue(evidenceIndex[ref.evidenceId].assertion.value, finding.value));
        finding.supporting = finding.supporting.filter(ref => equalValue(evidenceIndex[ref.evidenceId].assertion.value, finding.value));
        if (finding.contradicting.length) finding.reasons.push("informal_contradiction");
      }
    }
    return finding;
  });
  const find = (id: string) => findings.find(f => f.id === id);
  const comparisons: Analysis["comparisons"] = input.playbook.comparisons.map(c => {
    const left = find(c.left)!, right = find(c.right)!;
    const result = left.state === "SUPPORTED" && right.state === "SUPPORTED" ? equalValue(left.value, right.value) ? "match" : "mismatch" : "not_established";
    return { id: c.id, label: c.label, left: c.left, right: c.right, result, reasons: result === "not_established" ? [left, right].filter(f => f.state !== "SUPPORTED").map(f => `unestablished:${f.id}`) : [`supported_${result}`] };
  });
  const primary = comparisons[0];
  const outcome = !primary || primary.result === "not_established" ? "not_established" : input.playbook.comparisons[0].outcomes[primary.result];
  const rule = input.playbook.outcome_rules[outcome], step = input.playbook.next_steps[rule.next_step];
  const derivations = input.playbook.derivations.map(d => {
    if (d.function !== "regimeExplainsPaidAmount") throw new Error(`Unknown derivation ${d.function}`);
    return { id: d.id, ...regimeExplainsPaidAmount({ reference: find(d.inputs.reference), processedRegime: find(d.inputs.processedRegime), agreedRegime: find(d.inputs.agreedRegime), paid: find(d.inputs.paid) }, input.case.reported) };
  });
  const candidates = sources.filter(s => s.kind === "document" && ["procedure", "policy"].includes(s.data.type) && s.data.topics.some(topic => input.playbook.procedure_topics.includes(topic))).map(source => {
    const reasons = applicability(source, input, { from: current, to: current });
    if (source.kind === "document" && !source.data.owner) reasons.push("no_owner");
    if (source.data.status !== "approved") reasons.push("not_approved");
    return { source, reasons };
  });
  const selected = candidates.filter(c => !c.reasons.length).sort((a,b) => (b.source.data.valid_from || "").localeCompare(a.source.data.valid_from || "") || a.source.id.localeCompare(b.source.id))[0]?.source || null;
  const procedure: Analysis["procedure"] = { selected, notApplicable: candidates.filter(c => c.source.id !== selected?.id).map(c => ({ source: c.source, reasons: c.reasons.length ? c.reasons : ["older_procedure"] })) };
  const gaps: Analysis["gaps"] = findings.flatMap(f => [...(f.state === "SUPPORTED" ? [] : [{ code: `finding_${f.state.toLowerCase()}`, findingId: f.id, evidenceIds: [...f.authoritative, ...f.supporting].map(r => r.evidenceId) }]), ...(f.contradicting.length ? [{ code: "informal_contradiction", findingId: f.id, evidenceIds: f.contradicting.map(r => r.evidenceId) }] : [])]);
  if (!selected) gaps.push({ code: "no_current_procedure", evidenceIds: [] });
  if (input.case.reported?.basis === "unknown") gaps.push({ code: "unknown_amount_basis", evidenceIds: [] });
  const rankedPrecedents = input.precedents.filter(p => p.id !== input.case.id && p.question_type === input.case.question_type && Date.parse(p.decided_at) <= Date.parse(input.asOf)).map(p => {
    const sameCause = Boolean(rule.root_cause_hypothesis && p.root_cause === rule.root_cause_hypothesis), shared = p.topics.filter(topic => input.case.topics.some(value => value === topic)), sameCountry = p.country === input.client.country;
    const flags = ["reversed", "complaint_reopened"].includes(p.outcome.status) ? ["later_reversed"] : [];
    const confirmed = p.outcome.status === "confirmed" && (!p.outcome.confirmed_at || Date.parse(p.outcome.confirmed_at) <= Date.parse(input.asOf));
    return { ...p, matchReasons: [...(sameCause ? ["same_root_cause"] : []), ...shared.map(t => `shared_topic:${t}`), ...(sameCountry ? ["same_country"] : [])], differences: [...(!sameCountry ? [`other_country:${p.country}`] : []), ...(rule.root_cause_hypothesis && !sameCause ? [`other_root_cause:${p.root_cause}`] : [])], flags, score: (sameCause ? 3 : 0) + shared.length + (sameCountry ? 1 : 0), confirmed };
  }).sort((a,b) => b.score - a.score || Number(b.confirmed) - Number(a.confirmed) || a.id.localeCompare(b.id));
  const precedents = rankedPrecedents.slice(0,3).map(({ score: _score, confirmed: _confirmed, ...p }) => p);
  const experts = input.people.filter(p => p.active && p.organisation === "SDWORX" && p.role !== "client_hr" && p.id !== input.currentUserId).map(person => {
    const owner = selected?.kind === "document" && selected.data.owner === person.id, responsibilities = (person.responsibilities || []).filter(t => input.playbook.expert_topics.includes(t)), country = person.countries?.includes(input.client.country), precedent = rankedPrecedents.some(p => p.confirmed && !p.flags.length && p.root_cause === rule.root_cause_hypothesis && p.decided_by === person.id);
    return { person, reasons: [...(owner ? ["owns_current_procedure"] : []), ...responsibilities.map(t => `responsibility:${t}`), ...(country ? ["same_country"] : []), ...(precedent ? ["resolved_confirmed_precedent"] : [])], questionKey: rule.expert_question, score: (owner ? 3 : 0) + responsibilities.length * 2 + (country ? 1 : 0) + (precedent ? 3 : 0) };
  }).filter(p => p.score > 0).sort((a,b) => b.score - a.score || a.person.id.localeCompare(b.person.id)).slice(0,3).map(({ score: _score, ...p }) => p);
  return { analysisVersion: 1, asOf: input.asOf, excludedSourceIds: [...new Set(input.excludedSourceIds)].sort(), context: { case: input.case, client: input.client, employee: input.employee }, findings, comparisons, derivations, outcome, nextStep: { id: rule.next_step, label: step.label, ownerRole: step.owner_role, reasons: [outcome] }, procedure, gaps, precedents, experts, evidenceIndex };
}
export function diffAnalyses(base: Analysis, changed: Analysis): AnalysisDiff {
  return { findings: changed.findings.filter(f => { const before = base.findings.find(b => b.id === f.id); return !before || before.state !== f.state || !equalValue(before.value, f.value); }).map(f => ({ id: f.id, before: { state: base.findings.find(b => b.id === f.id)!.state, value: base.findings.find(b => b.id === f.id)!.value }, after: { state: f.state, value: f.value } })), outcome: base.outcome === changed.outcome ? null : { before: base.outcome, after: changed.outcome }, nextStep: base.nextStep.id === changed.nextStep.id ? null : { before: base.nextStep.id, after: changed.nextStep.id } };
}
