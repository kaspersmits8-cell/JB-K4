import type { Person } from "../../data/schemas.ts";
import type { Repository, User } from "./index.ts";
/** Read-only presentation data, behind the same case and source scope checks. */
export function casePresentation(repo: Repository, user: User, caseId: string) {
  const c = repo.getCase(user, caseId);
  if (!c) return null;
  const names = Object.fromEntries(repo.experts(user).map(p => [p.id, p.name]));
  const row = repo.db.prepare("SELECT payload FROM people WHERE id = ?").get(c.reporter_id) as { payload: string } | undefined;
  const reporter = row ? JSON.parse(row.payload) as Person : null;
  if (reporter && (reporter.organisation === c.client_id || names[reporter.id])) names[reporter.id] = reporter.name;
  const attachments = [...new Set(c.timeline.flatMap(event => event.source_ids))].flatMap(id => { const source = repo.getSource(user, id); return source ? [source] : []; });
  return { names, attachments, sourceNames: Object.fromEntries(repo.sources(user).map(source => [source.id, source])) };
}
