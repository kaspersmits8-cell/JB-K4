import { expect, test, vi } from "vitest";
import { analyzeCase } from "../src/engine/analyze.ts";
import { engineInput } from "./helpers/engine.ts";
import { draftClientReply, draftExplanation, draftExpertQuestion, draftInput, validateDraft } from "../src/ai/tasks/drafts.ts";
import type { LLMProvider } from "../src/ai/provider.ts";
test("mock drafting is deterministic and never makes network calls", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => { throw new Error("Network forbidden"); });
  try {
    const analysis = analyzeCase(engineInput());
    expect(await draftClientReply(analysis)).toEqual(await draftClientReply(analysis));
    expect((await draftExplanation(analysis)).sentences.length).toBeGreaterThan(0);
    expect((await draftExpertQuestion(analysis, analysis.experts[0].person.id)).sentences).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  } finally { fetch.mockRestore(); }
});
test("client projection removes internal evidence, hidden values and internally derived next steps", async () => {
  const analysis = analyzeCase(engineInput()), input = draftInput(analysis, true);
  expect(JSON.stringify(input)).not.toContain("REC-0004"); expect(JSON.stringify(input)).not.toContain("DOC-0001"); expect(JSON.stringify(input)).not.toContain("REC-0003");
  expect(input.findings.find(f => f.id === "reference_salary")?.value).toBeNull();
  expect(input.findings.find(f => f.id === "processed_regime")?.state).toBe("INDICATION");
  expect(input.nextStepId).toBe("request_confirmation");
  const draft = await draftClientReply(analysis);
  for (const sentence of draft.sentences) for (const id of sentence.evidenceIds) expect(analysis.evidenceIndex[id].source.data.visibility).toBe("client_shareable");
  expect(JSON.stringify(draft)).not.toContain("5.000"); expect(draft.origin).toBe("Template");
});
test("invalid JSON, unknown citations and facts without evidence are dropped or replaced", async () => {
  const analysis = analyzeCase(engineInput()), input = draftInput(analysis, true);
  expect(validateDraft({ sentences: [{ text: "Wrong", kind: "fact", evidenceIds: ["REC-9999"] }] }, input)).toBeNull();
  expect(validateDraft({ sentences: [{ text: "Wrong", kind: "fact", evidenceIds: [] }] }, input)).toBeNull();
  const broken: LLMProvider = { name: "broken-test", async generateJSON() { throw new Error("Invalid JSON"); } };
  expect(await draftClientReply(analysis, broken)).toEqual(await draftClientReply(analysis));
});
test("reply templates support Dutch, French and English and retain uncertainty", async () => {
  for (const [language, expected] of [["nl", "Nog niet bevestigd"], ["fr", "Pas encore confirmé"], ["en", "Not yet confirmed"]] as const) {
    const input = engineInput(); input.case.language = language;
    expect(JSON.stringify(await draftClientReply(analyzeCase(input)))).toContain(expected);
  }
});
