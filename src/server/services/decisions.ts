import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Repository, User, CorrectionState } from "../repo/index.ts";
import { requireUser, caseIdSchema } from "./analysis.ts";
import { AppError } from "../errors.ts";
export const decisionSchema = z.object({ action: z.enum(["record", "send_explanation", "request_confirmation", "propose_correction", "approve_correction", "mark_executed", "confirm_outcome"]), rationale: z.string().trim().min(1).max(4000) }).strict();
export function recordDecision(repo: Repository, user: User | null, rawId: unknown, rawInput: unknown, now: () => Date = () => new Date()) {
  const id = caseIdSchema.parse(rawId), input = decisionSchema.parse(rawInput);
  return repo.db.transaction(() => {
    const current = requireUser(repo, user);
    if (!repo.getCase(current, id)) throw new AppError(404, "not_found");
    const previous = repo.status(current, id)!;
    let next: CorrectionState | null = null;
    if (input.action === "propose_correction") { if (previous.stage !== "none") throw new AppError(409, "invalid_transition"); next = { stage: "proposed", proposedBy: current.personId }; }
    if (input.action === "approve_correction") {
      if (current.role !== "payroll_lead" || previous.proposedBy === current.personId) throw new AppError(403, "approval_not_allowed");
      if (previous.stage !== "proposed") throw new AppError(409, "invalid_transition"); next = { ...previous, stage: "approved" };
    }
    if (input.action === "mark_executed") { if (previous.stage !== "approved") throw new AppError(409, "invalid_transition"); next = { ...previous, stage: "executed" }; }
    if (input.action === "confirm_outcome") { if (previous.stage !== "executed") throw new AppError(409, "invalid_transition"); next = { ...previous, stage: "confirmed" }; }
    const decision = { id: randomUUID(), case_id: id, actor_id: current.id, action: input.action, rationale: input.rationale, at: now().toISOString() };
    repo.appendDecision(current, decision, next);
    return { decision, correction: next || previous };
  }).immediate();
}
