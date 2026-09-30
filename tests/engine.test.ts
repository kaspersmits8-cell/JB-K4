import { expect, test } from "vitest";
import { analyzeCase, diffAnalyses, equalValue } from "../src/engine/analyze.ts";
import { regimeExplainsPaidAmount } from "../src/engine/derivations.ts";
import { applicability } from "../src/engine/applicability.ts";
import { mainData } from "./helpers/data.ts";
import { engineInput } from "./helpers/engine.ts";

test("main case is supported mismatch, current BE procedure and explained 1500 gross gap", () => {
  const result = analyzeCase(engineInput());
  expect(result.findings[0]).toMatchObject({ state: "SUPPORTED", value: 100 });
  expect(result.findings[1]).toMatchObject({ state: "SUPPORTED", value: 70 });
  expect(result.outcome).toBe("regime_mismatch"); expect(result.nextStep.id).toBe("start_correction_review");
  expect(result.procedure.selected?.id).toBe("DOC-0001");
  expect(result.findings[0].notApplicable).toContainEqual({ evidenceId: "DOC-0002#assertions[0]", reasons: ["other_period"] });
  expect(result.derivations[0]).toMatchObject({ status: "explains_paid_amount", reference: 5000, processedRegime: 70, paid: 3500, expectedAtProcessed: 3500, expectedAtAgreed: 5000, gap: 1500, reportedGap: 1500 });
  expect(result.experts[0].person.id).toBe("P-0003"); expect(result.experts[0].reasons).toContain("owns_current_procedure");
});
test("what-if becomes indication and requests confirmation; reset restores baseline without mutations", () => {
  const input = engineInput(), snapshot = structuredClone(input), base = analyzeCase(input);
  const changed = analyzeCase({ ...input, excludedSourceIds: ["REC-0002"] });
  expect(changed.findings[0]).toMatchObject({ state: "INDICATION", value: 100 });
  expect(changed.outcome).toBe("not_established"); expect(changed.nextStep.id).toBe("request_confirmation");
  expect(diffAnalyses(base, changed).findings).toContainEqual({ id: "agreed_regime", before: { state: "SUPPORTED", value: 100 }, after: { state: "INDICATION", value: 100 } });
  expect(analyzeCase(input)).toEqual(base); expect(input).toEqual(snapshot);
});
test("processed correctly produces match; informal contradictions become gaps, not a false conflict", () => {
  const data = mainData(); data.records[0].facts[0].value = 70;
  const result = analyzeCase(engineInput(data));
  expect(result.outcome).toBe("regime_consistent"); expect(result.nextStep.id).toBe("explain_to_client");
  expect(result.findings[0].state).toBe("SUPPORTED"); expect(result.gaps.some(g => g.code === "informal_contradiction")).toBe(true);
});
test("conflicting authorities, supporting conflicts and no evidence follow the state table", () => {
  const data = mainData(); data.records.push({ ...data.records[0], id: "REC-0099", facts: [{ attribute: "work_regime_pct", value: 80 }] });
  expect(analyzeCase(engineInput(data)).findings[0].state).toBe("CONFLICTING");
  const input = engineInput(); input.assertions = []; expect(analyzeCase(input).findings.every(f => f.state === "INSUFFICIENT")).toBe(true);
  const supporting = engineInput(); supporting.excludedSourceIds = ["REC-0002"]; supporting.assertions.push({ ...supporting.assertions.find(a => a.sourceId === "DOC-0003")!, id: "DOC-0003#assertions[1]", value: 50 });
  expect(analyzeCase(supporting).findings[0].state).toBe("CONFLICTING");
});
test("procedures use current time, exclude ownerless, other-country, superseded and unapproved versions", () => {
  const data = mainData(), procedure = data.documents[0];
  data.documents[0] = { ...procedure, owner: null };
  let result = analyzeCase(engineInput(data));
  expect(result.procedure.selected).toBeNull(); expect(result.procedure.notApplicable[0].reasons).toContain("no_owner"); expect(result.gaps.some(g => g.code === "no_current_procedure")).toBe(true);
  data.documents[0] = { ...procedure, scope: { countries: ["NL"], client_ids: ["*"] } };
  result = analyzeCase(engineInput(data)); expect(result.procedure.notApplicable[0].reasons).toContain("other_country");
  data.documents[0] = { ...procedure, valid_to: "2026-01-31" }; result = analyzeCase(engineInput(data)); expect(result.procedure.notApplicable[0].reasons).toContain("other_period");
  data.documents[0] = procedure; data.documents.push({ ...procedure, id: "DOC-0010", supersedes: procedure.id, valid_from: "2026-02-01" });
  result = analyzeCase(engineInput(data)); expect(result.procedure.selected?.id).toBe("DOC-0010"); expect(result.procedure.notApplicable.find(p => p.source.id === procedure.id)?.reasons).toContain("superseded");
});
test("source applicability reports all reasons and respects knowledge time", () => {
  const input = engineInput(); input.sources[0].data.known_at = "2027-01-01T00:00:00Z";
  expect(analyzeCase(input).findings[0].notApplicable.some(r => r.reasons.includes("not_yet_known"))).toBe(true);
  const source = input.sources[0]; source.data.valid_to = "2025-12-31"; source.data.status = "rejected"; input.excludedSourceIds = [source.id];
  expect(applicability(source, input, input.case.disputed_period)).toEqual(expect.arrayContaining(["other_period", "not_yet_known", "rejected", "excluded_by_user"]));
});
test("reversed precedents rank below equally relevant confirmed cases and give no expert credit", () => {
  const input = engineInput(), original = input.precedents[0];
  input.precedents.push({ ...original, id: "CASE-0003", outcome: { status: "reversed" }, decided_by: "P-0004" });
  const result = analyzeCase(input);
  expect(result.precedents[0].id).toBe(original.id); expect(result.precedents[1].flags).toContain("later_reversed");
  expect(result.experts.find(e => e.person.id === "P-0004")?.reasons || []).not.toContain("resolved_confirmed_precedent");
  expect(JSON.stringify(result)).not.toContain('"score"');
});
test("derived evidence shares origin and every reference resolves", () => {
  const result = analyzeCase(engineInput());
  expect(result.evidenceIndex["REC-0004#facts[0]"].sameOriginAs).toContain("REC-0005");
  expect(result.evidenceIndex["REC-0005#facts[0]"].sameOriginAs).toContain("REC-0004");
  for (const f of result.findings) for (const refs of [f.authoritative, f.supporting, f.contradicting, f.ignored, f.notApplicable]) for (const ref of refs) expect(result.evidenceIndex[ref.evidenceId]).toBeDefined();
});
test("deterministic output is independent of source order and string equality trims and folds case", () => {
  const input = engineInput(), result = analyzeCase(input);
  expect(analyzeCase(input)).toEqual(result);
  expect(analyzeCase({ ...input, sources: [...input.sources].reverse(), assertions: [...input.assertions].reverse(), people: [...input.people].reverse() })).toEqual(result);
  expect(equalValue(" TRUE ", "true")).toBe(true); expect(equalValue(70, "70")).toBe(false);
});
test("derivation requires supported inputs, respects one-euro tolerance and does not compare net to gross", () => {
  const result = analyzeCase(engineInput()), [agreedRegime, processedRegime, reference, paid] = result.findings;
  expect(regimeExplainsPaidAmount({ reference, processedRegime, paid: { ...paid, state: "INDICATION" }, agreedRegime }).status).toBe("not_established");
  expect(regimeExplainsPaidAmount({ reference, processedRegime, paid: { ...paid, value: 3501 }, agreedRegime }).status).toBe("explains_paid_amount");
  expect(regimeExplainsPaidAmount({ reference, processedRegime, paid: { ...paid, value: 3502 }, agreedRegime }).status).toBe("does_not_explain");
  expect(regimeExplainsPaidAmount({ reference, processedRegime, paid, agreedRegime }, { basis: "net", currency: "EUR", expected_amount: 5000, received_amount: 3500 }).reportedGap).toBeUndefined();
});
