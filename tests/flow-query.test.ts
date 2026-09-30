import { expect, test } from "vitest";
import { flowQuerySchema, flowUrl } from "../src/ui/flow-query.ts";
test("URL state rejects repeated, oversized, invalid tabs and foreign-shaped ids", () => {
  for (const query of [{ ask: ["one", "two"] }, { ask: "a".repeat(301) }, { tab: "sql" }, { exclude: "P-0001" }, { source: "../../secret" }, { test: "true" }]) expect(flowQuerySchema.safeParse(query).success).toBe(false);
  expect(flowQuerySchema.parse({ ask: "<script>alert(1)</script>" }).ask).toContain("<script>");
});
test("navigation preserves questions and test state with correct escaping", () => {
  const query = flowQuerySchema.parse({ ask: "Why & when?", exclude: "REC-0002", test: "1" });
  const url = flowUrl("CASE-0001", "answer", query, { tab: "people" });
  const parsed = new URL(url, "https://example.com");
  expect(parsed.searchParams.get("ask")).toBe("Why & when?");
  expect(parsed.searchParams.get("exclude")).toBe("REC-0002");
  expect(parsed.searchParams.get("tab")).toBe("people");
});
