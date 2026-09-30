import { z } from "zod";
const sourceId = z.string().regex(/^(REC|DOC)-\d{4}$/);
export const flowQuerySchema = z.object({
  ask: z.string().trim().max(300).default(""),
  tab: z.enum(["sources", "past", "people", "procedure"]).default("sources"),
  exclude: z.string().max(2000).default("").refine(value => !value || z.array(sourceId).max(100).safeParse(value.split(",")).success),
  test: z.enum(["0", "1"]).default("0"),
  source: sourceId.optional(),
  checks: z.string().max(1000).regex(/^[a-z_,]*$/).optional(),
  history: z.enum(["0", "1"]).default("0"),
  unused: z.enum(["0", "1"]).default("0"),
});
export type FlowQuery = z.infer<typeof flowQuerySchema>;
export type Step = "question" | "answer" | "respond";
export function flowUrl(caseId: string, step: Step, query: FlowQuery, updates: Partial<FlowQuery> = {}) {
  const state = { ...query, ...updates };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) if (value !== undefined && value !== "" && value !== "0") params.set(key, value);
  return `/cases/${caseId}${step === "question" ? "" : `/${step}`}${params.size ? `?${params}` : ""}`;
}
