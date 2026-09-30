import { expect, test, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, refresh() {} }) }));
import { AsOf, Dossier } from "../src/ui/Dossier.tsx";
import { analyzeCase, diffAnalyses } from "../src/engine/analyze.ts";
import { engineInput } from "./helpers/engine.ts";
import { draftClientReply, draftExplanation } from "../src/ai/tasks/drafts.ts";
test("dossier date displays the exact effective UTC date and pinned status", () => {
  const html = renderToStaticMarkup(createElement(AsOf, { asOf: "2026-02-01T09:15:00Z", demoClock: true }));
  expect(html).toContain('dateTime="2026-02-01T09:15:00Z"'); expect(html).toContain("1 Feb 2026, 09:15 UTC"); expect(html).toContain("Demo clock pinned");
});
test("rendered dossier exposes findings and what-if differences while escaping source text", async () => {
  const input = engineInput(); input.case.question_text = '<script>alert("untrusted")</script>';
  const base = analyzeCase(input), analysis = analyzeCase({ ...input, excludedSourceIds: ["REC-0002"] });
  const reply = await draftClientReply(analysis), explanation = await draftExplanation(analysis);
  const html = renderToStaticMarkup(createElement(Dossier, { result: { analysis, diff: diffAnalyses(base, analysis), demoClock: true, decisions: [], correction: { stage: "none", proposedBy: null } }, user: { id: "u1", email: "jan@example.com", personId: "P-0001", role: "consultant" }, reply, explanation, expertQuestions: [] }));
  expect(html).toContain("What-if"); expect(html).toContain("Unconfirmed"); expect(html).toContain("Reset"); expect(html).toContain("Findings"); expect(html).toContain("Other period");
  expect(html).not.toContain("<script>alert"); expect(html).toContain("&lt;script&gt;");
});
