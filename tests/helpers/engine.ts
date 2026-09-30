import playbook from "../../config/playbooks/payslip_dispute.json" with { type: "json" };
import { normalize } from "../../src/data/normalized.ts";
import type { Dataset } from "../../src/data/schemas.ts";
import type { EngineInput } from "../../src/engine/types.ts";
import { mainData } from "./data.ts";
export function engineInput(data: Dataset = mainData()): EngineInput {
  const normalized = normalize(data);
  return { case: data.cases[0], client: data.clients[0], employee: data.employees[0], sources: normalized.sources, assertions: normalized.assertions, people: data.people, precedents: data.cases.filter(c => c.resolution && c.outcome).map(c => ({ id: c.id, question_type: c.question_type, topics: c.topics, country: data.clients.find(client => client.id === c.client_id)!.country, root_cause: c.resolution!.root_cause, summary: c.resolution!.summary, decided_by: c.resolution!.decided_by, decided_at: c.resolution!.decided_at, outcome: { status: c.outcome!.status, confirmed_at: c.outcome!.confirmed_at }, anonymised: true })), playbook, asOf: "2026-02-01T09:15:00Z", currentUserId: "P-0001", excludedSourceIds: [] };
}
