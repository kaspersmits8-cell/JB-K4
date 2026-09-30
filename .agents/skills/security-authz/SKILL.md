---
name: security-authz
description: Authentication, authorization and security rules for the Trust Dossier, aligned with the Aikido AI code audit used in judging (business logic flaws, IDOR, authentication, authorization). Use this skill whenever you touch login, sessions, route handlers, server actions, middleware, the scoped repository, roles, decisions and approvals, environment variables, rendering of source or AI text, or dependencies. Also use it before finishing any task that adds or changes an endpoint.
---

# Security & authorization

## Why
The Aikido audit is 10% of the score, and SD Worx is an HR and payroll company: separating clients' data *is* the product's credibility. Aikido reasons about logic and access patterns, so correctness must be obvious in the code, not just hidden behind a login page.

## Identity
- **Users:** SQLite `users` table (email, person_id, role, password_hash with bcrypt cost ≥ 12).
  - Users are created only via `npm run user:create`; the password is prompted, never passed as an argument.
  - No default or seeded passwords in the repo.
- **Sessions:** iron-session, httpOnly, secure in production, sameSite=lax, 8-hour expiry.
  - `SESSION_SECRET` must be ≥ 32 characters; the app refuses to start without it.
- **Login:** generic error message; simple per-IP-plus-email rate limit (in-memory is fine). Logout clears the session.

## Authorization: one choke point
- **Only `src/server/repo/*` queries client data**, and every repo function takes `user` first: `getCase(user, caseId)`.
- **Scope:**
  - Consultants see clients whose `consultant_ids` include their person id.
  - Payroll leads see clients in the countries listed on their person record.
  - Nobody sees everything.
- **Out of scope → return `null` → the route answers 404, not 403**, so ids cannot be probed.
- **Precedents from clients outside scope:** only anonymised fields (root_cause, summary, topics, country, decided_by, outcome). Never employee, amounts or question_text.
- **Check authorization in every route handler, server action and server component that loads data.** Middleware may redirect anonymous users but is never the access control (Next.js middleware bypasses have happened before).
- **Client-facing drafts:** filter evidence by `visibility` on the server, both before the LLM call and before returning the draft.

## Business logic
- **Roles:**
  - A consultant can record a decision, send an explanation, request confirmation and propose a correction review.
  - Only a payroll_lead can approve a correction, and never their own proposal (four-eyes).
  - Execution and outcome confirmation are separate transitions.
- **Implement transitions as a server-side state machine.** The UI only hides buttons.
- **Actor and time come from the session and the server clock**, never from the request body.
- **What-if exclusions never mutate stored data.** They are a validated query parameter, restricted to source ids in scope.

## Input and output
- zod-validate every param, query and body. Ids match `^[A-Z]{1,4}-\d{4}(#[\w\[\]\.]+)?$`.
- Prepared statements only; never build SQL strings.
- Render source text and AI text as text. Markdown bodies go through a sanitising renderer (no raw HTML). No `dangerouslySetInnerHTML`.
- Security headers in `next.config`: a CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `frame-ancestors 'none'`.
- Errors return a generic message and an id. No stack traces to the client.

## Secrets and the public repo
- `.env.local` is git-ignored; `.env.example` is complete.
- LLM credentials live only in server code; never use the `NEXT_PUBLIC_` prefix for them.
- The repo is public during judging: no keys, no real data.

## Aikido loop
1. After milestone 1: connect the repo and run the AI code audit. Take a baseline screenshot.
2. Fix the findings and mark them resolved.
3. Rescan and take an after screenshot.
4. Run it again before the final submission.

## Required tests
- Jan opening a CL-0002 case → 404.
- A foreign case id in the URL or API → 404.
- An unauthenticated API call → 401.
- A consultant cannot approve a correction.
- A payroll lead cannot approve their own proposal.
- A client reply draft contains no internal evidence ids.
- What-if with a source id outside scope → 400.
