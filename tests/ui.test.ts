import { expect, test, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, replace() {}, refresh() {} }) }));
import { Answer } from "../src/ui/Answer.tsx";
import { Question } from "../src/ui/Question.tsx";
import { analyzeCase, diffAnalyses } from "../src/engine/analyze.ts";
import { normalize } from "../src/data/normalized.ts";
import { engineInput } from "./helpers/engine.ts";
import { flowData } from "./helpers/flow.ts";
import { flowQuerySchema } from "../src/ui/flow-query.ts";
import { checkData } from "../src/data/check.ts";
import { fixtureConnector } from "./helpers/data.ts";
import { dateRange, shortDate, money, calculationText } from "../src/ui/copy.ts";
function view(excluded: string[] = []) {
  const d = flowData(), input = engineInput(d), baseline = analyzeCase(input), analysis = analyzeCase({...input,excludedSourceIds:excluded});
  return { result:{analysis,diff:diffAnalyses(baseline,analysis),demoClock:true,decisions:[],correction:{stage:"none" as const,proposedBy:null}},user:{id:"u1",email:"jan@example.com",personId:"P-0001",role:"consultant" as const},query:flowQuerySchema.parse({exclude:excluded.join(",")}),presentation:{names:Object.fromEntries(d.people.map(p => [p.id,p.name])),attachments:normalize(d).sources.slice(0,2),sourceNames:Object.fromEntries(normalize(d).sources.map(s => [s.id,s]))} };
}
const visibleText = (html: string) => html.replace(/<[^>]*>/g,"");
test("flow fixtures validate and preserve the intended contract-removal outcome", () => {
  expect(checkData(fixtureConnector(flowData())).errors).toBe(0);
  const data = view(["REC-0002"]);
  expect(data.result.analysis.findings[0]).toMatchObject({state:"INDICATION",value:70});
});
test("answer hides experiments by default and keeps facts and readable labels", () => {
  const data = view(), html = renderToStaticMarkup(createElement(Answer,{data,questions:[]}));
  expect(html).toContain("Test this answer"); expect(html).not.toContain("Remove from this test");
  const text = visibleText(html);
  expect(text).not.toMatch(/(?:REC|DOC|CASE|P)-\d{4}|\b[a-z]+_[a-z_]+\b|\d{4}-\d{2}-\d{2}|Open — Open|Authoritative/);
  expect(text).toContain("Starts 1 Mar 2026");
  expect(text).not.toContain("Other evidence");
  expect(text).toContain("Copied from Payroll input, January 2026");
});
test("what-if shows the change and question text is escaped", () => {
  const data = view(["REC-0002"]); data.query.ask = '<script>alert("untrusted")</script>';
  const html = renderToStaticMarkup(createElement(Answer,{data,questions:[]}));
  expect(html).toContain("was Backed → now Unconfirmed"); expect(html).toContain("Remove from this test");
  expect(html).not.toContain('<script>alert'); expect(html).toContain("&lt;script&gt;");
  const question = renderToStaticMarkup(createElement(Question,{data}));
  expect(question).toContain("Melanie"); expect(question).toContain("Attachments");
});
test("formatting omits open ranges, clock jargon and redundant decimal zeroes", () => {
  expect(dateRange(null,null)).toBe(""); expect(dateRange("2026-01-01",null)).toBe("from 1 Jan 2026");
  expect(shortDate("2026-02-03T09:00:00Z")).toBe("3 Feb 2026"); expect(money(5000)).toBe("€5,000");
  expect(calculationText(view().result.analysis.derivations[0])).toContain("€1,500");
});
