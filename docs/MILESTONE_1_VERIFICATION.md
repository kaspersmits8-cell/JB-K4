# Milestone 1 verification

Windows, Node 24.13.0, npm 11.6.2. Implementation follows the revised nine-phase
plan; phase commits are local. No push or deployment was performed.

| Check | Result |
| --- | --- |
| better-sqlite3 installation, prepared writes, transaction commit/rollback | Passed; no fallback required. |
| Typecheck | Passed. |
| ESLint | Passed, no warnings. |
| Vitest | 39 tests passed across 10 files. |
| Production build | Passed. |
| Supplied templates | 0 errors, 1 intended ownerless-document warning. |
| Main acceptance fixture | 0 errors, 2 intended ownerless-document warnings; CLI ingest succeeded. |
| Broken fixture CLI | Correctly exited 1 with 11 per-file/field errors. |
| Prompted user:create | Created a scoped local verification account with hidden password input. No password was committed. |
| Invalid SESSION_SECRET startup | Production process exited 1 with a configuration diagnostic. |
| Engine scenarios | Main mismatch/gap, what-if/reset, correct processing, conflicts, absent evidence, procedures, knowledge date, reversed precedent, shared origin, determinism passed. |
| DEMO_NOW | API and rendered dossier show the exact effective instant; baseline/what-if share it; fallback clock captured once. |
| Orphaned users | Warning, retained account, denied new login and old session, and restored eligibility tested. |
| Authorization/workflow | Anonymous and foreign access, unsupported roles, approval denials, skipped/repeated transitions, source exclusions and server actor/time tested. |
| Data integrity | Invalid/failed ingest rollback, idempotence, retained operational rows and unchanged input contents tested. |
| Mock AI | No network calls, citation/schema validation, three languages and private-evidence leakage checks passed. |
| Browser: empty inbox | Observed in the running app on localhost:3000. |
| Browser: populated fixture walkthrough | Pending. Automatic approval review timed out twice when opening localhost:3003; no workaround was attempted. |

The milestone goal remains incomplete until the populated browser walkthrough
passes: login → inbox → main finding → old email/source drawer → precedents and
experts → exclude approved change → Indication/request confirmation → Reset →
reply draft → record decision/timeline. Automated engine, API and rendered-UI
tests do not replace this requested browser walkthrough.

No implementation or verification code writes to `data/` or configured input
data. The teammate's dataset and parallel branding/login work arrived separately
in this shared checkout and were preserved. Verification used
`tests/fixtures/main` and a separate ignored `.local/verification.db`.

## Stubs, clarifications and handoff

- Mock templates only; no real AI, extraction, search, embeddings, chat or send
  integration. “Send explanation” is an audit event, not an outgoing message.
- better-sqlite3 runs on this machine; node:sqlite was smoke-tested but unused.
- Open-case assignee omissions warn. Partial reported amounts are supported.
- Source Markdown is escaped text with exact-quote highlighting. Work-regime
  percentages remain visible; numeric trust scores are never exposed.
- The separately requested `1` / `1` development preview has empty scope and is
  disabled in production. Provisioned accounts retain the approved role rules.
- No blocking data-contract questions remain. Data authors should retain stable
  person IDs, exact body quotes, safe precedent summaries and explicit gross/net
  basis, and review every checker/ingest warning.
- Aikido baseline/rescan and deployment are external follow-ups.
