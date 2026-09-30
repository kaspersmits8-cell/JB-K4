import type { Source } from "../data/normalized.ts";
import type { EngineInput } from "./types.ts";
export const overlaps = (from: string | null, to: string | null, period: { from: string; to: string }) => (!from || from <= period.to) && (!to || to >= period.from);
export function applicability(source: Source, input: EngineInput, period: { from: string; to: string }, validity?: { from: string | null; to: string | null }): string[] {
  const reasons: string[] = [];
  if (!overlaps(validity ? validity.from : source.data.valid_from, validity ? validity.to : source.data.valid_to, period)) reasons.push("other_period");
  if (source.kind === "record") { if (source.data.client_id !== input.client.id) reasons.push("other_client"); if (source.data.employee_id !== input.employee.id) reasons.push("other_employee"); }
  else {
    if (!source.data.scope.client_ids.some(id => id === "*" || id === input.client.id)) reasons.push("other_client");
    if (!source.data.scope.countries.some(country => country === "*" || country === input.client.country)) reasons.push("other_country");
    if (source.data.scope.employee_ids && !source.data.scope.employee_ids.includes(input.employee.id)) reasons.push("other_employee");
  }
  if (Date.parse(source.data.known_at) > Date.parse(input.asOf)) reasons.push("not_yet_known");
  if (source.data.status === "rejected") reasons.push("rejected");
  if (input.excludedSourceIds.includes(source.id)) reasons.push("excluded_by_user");
  if (source.data.status === "superseded") reasons.push("superseded");
  else if (source.kind === "document" && input.sources.some(candidate => candidate.kind === "document" && candidate.data.supersedes === source.id && candidate.data.status === "approved" && !input.excludedSourceIds.includes(candidate.id) && Date.parse(candidate.data.known_at) <= Date.parse(input.asOf) && overlaps(candidate.data.valid_from, candidate.data.valid_to, period) && candidate.data.scope.client_ids.some(id => id === "*" || id === input.client.id) && candidate.data.scope.countries.some(country => country === "*" || country === input.client.country) && (!candidate.data.scope.employee_ids || candidate.data.scope.employee_ids.includes(input.employee.id)))) reasons.push("superseded");
  return reasons;
}
