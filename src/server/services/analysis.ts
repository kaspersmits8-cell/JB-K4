import { z } from "zod";
import playbook from "../../../config/playbooks/payslip_dispute.json" with { type: "json" };
import { analyzeCase, diffAnalyses } from "../../engine/analyze.ts";
import { analysisTime, validateProvider } from "../config.ts";
import { Repository } from "../repo/index.ts";
import type { User } from "../repo/index.ts";
import { AppError } from "../errors.ts";
export const caseIdSchema = z.string().regex(/^CASE-\d{4}$/);
export const sourceIdSchema = z.string().regex(/^(REC|DOC)-\d{4}$/);
export function requireUser(repo: Repository, user: User | null): User {
  const current = user && repo.resolveUser(user.id);
  if (!current) throw new AppError(401, "unauthenticated");
  return current;
}
export function listCases(repo: Repository, user: User | null) {
  const current = requireUser(repo, user);
  return repo.cases(current).map(c => ({ ...c, client: repo.getClient(current, c.client_id)!, employee: repo.getEmployee(current, c.employee_id)! }));
}
export function getAnalysis(repo: Repository, user: User | null, rawId: unknown, rawExcluded: unknown = "", env: Record<string,string|undefined> = process.env, now: () => Date = () => new Date()) {
  const current = requireUser(repo, user), id = caseIdSchema.parse(rawId);
  const c = repo.getCase(current, id); if (!c) throw new AppError(404, "not_found");
  const query = z.string().max(2000).parse(rawExcluded);
  const excludedSourceIds = query ? z.array(sourceIdSchema).max(100).parse(query.split(",")) : [];
  const sources = repo.sources(current);
  if (excludedSourceIds.some(excluded => !sources.some(s => s.id === excluded))) throw new AppError(400, "invalid_exclusion");
  validateProvider(env);
  const asOf = analysisTime(env, now);
  const input = { case: c, client: repo.getClient(current, c.client_id)!, employee: repo.getEmployee(current, c.employee_id)!, assertions: repo.assertions(current, c.employee_id), sources, people: repo.experts(current), precedents: repo.precedents(current), playbook, asOf, currentUserId: current.personId, excludedSourceIds: [] as string[] };
  const baseline = analyzeCase(input), analysis = excludedSourceIds.length ? analyzeCase({ ...input, excludedSourceIds }) : baseline;
  return { analysis, diff: diffAnalyses(baseline, analysis), demoClock: Boolean(env.DEMO_NOW), decisions: repo.decisions(current, id)!, correction: repo.status(current, id)! };
}
export function getSource(repo: Repository, user: User | null, rawId: unknown) {
  const current = requireUser(repo, user), id = sourceIdSchema.parse(rawId);
  const source = repo.getSource(current, id); if (!source) throw new AppError(404, "not_found");
  return source;
}
