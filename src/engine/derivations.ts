import type { CaseData } from "../data/schemas.ts";
import type { Derivation, Finding } from "./types.ts";
export function regimeExplainsPaidAmount(input: { reference?: Finding; processedRegime?: Finding; agreedRegime?: Finding; paid?: Finding }, reported?: CaseData["reported"]): Omit<Derivation, "id"> {
  const missing = (["reference", "processedRegime", "paid"] as const).filter(key => input[key]?.state !== "SUPPORTED" || typeof input[key]?.value !== "number");
  if (missing.length) return { status: "not_established", reasons: missing.map(key => `missing_input:${key}`), evidenceIds: [] };
  const reference = input.reference!.value as number, processedRegime = input.processedRegime!.value as number, paid = input.paid!.value as number;
  const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const expectedAtProcessed = money(reference * processedRegime / 100), difference = money(expectedAtProcessed - paid);
  const explains = Math.abs(difference) <= 1;
  const result: Omit<Derivation, "id"> = { status: explains ? "explains_paid_amount" : "does_not_explain", reasons: [explains ? "processed_regime_explains_paid" : "processed_regime_does_not_explain_paid"], evidenceIds: [input.reference!, input.processedRegime!, input.paid!].flatMap(f => f.authoritative.map(r => r.evidenceId)), reference, processedRegime, paid, expectedAtProcessed, difference };
  if (input.agreedRegime?.state === "SUPPORTED" && typeof input.agreedRegime.value === "number") {
    result.expectedAtAgreed = money(reference * input.agreedRegime.value / 100); result.gap = money(result.expectedAtAgreed - paid);
    result.evidenceIds.push(...input.agreedRegime.authoritative.map(r => r.evidenceId));
    if (reported?.basis === "gross" && reported.expected_amount !== undefined && reported.received_amount !== undefined) { result.reportedGap = money(reported.expected_amount - reported.received_amount); result.reasons.push(Math.abs(result.reportedGap - result.gap) <= 1 ? "matches_reported_gap" : "differs_from_reported_gap"); }
  }
  return result;
}
