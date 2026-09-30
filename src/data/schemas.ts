import { z } from "zod";
import vocabulary from "../../config/vocabulary.json" with { type: "json" };
export { vocabulary };
const keys = <T extends Record<string, unknown>>(value: T) => Object.keys(value) as [keyof T & string, ...(keyof T & string)[]];
export const idSchema = z.string().regex(/^[A-Z]{1,4}-\d{4}$/);
const id = (prefix: string) => z.string().regex(new RegExp(`^${prefix}-\\d{4}$`));
const correspondent = z.union([id("P"), id("E")]);
const date = z.preprocess(v => v instanceof Date ? v.toISOString().slice(0, 10) : v, z.iso.date());
const time = z.preprocess(v => v instanceof Date ? v.toISOString() : v, z.iso.datetime({ offset: true }));
const country = z.enum(vocabulary.countries as [string, ...string[]]);
const topics = z.array(z.enum(keys(vocabulary.topics)));
const visibility = z.enum(keys(vocabulary.visibility));
const scoped = (schema: z.ZodString | typeof country) => z.union([z.tuple([z.literal("*")]), z.array(schema).min(1)]);
const range = { valid_from: date.nullable(), valid_to: date.nullable() };
export const factSchema = z.object({ attribute: z.enum(keys(vocabulary.attributes)), value: z.union([z.number().finite(), z.string(), z.boolean()]) }).superRefine((fact, ctx) => {
  if (typeof fact.value !== vocabulary.attributes[fact.attribute].type) ctx.addIssue({ code: "custom", path: ["value"], message: `Expected ${vocabulary.attributes[fact.attribute].type} for ${fact.attribute}` });
});
export const clientSchema = z.object({ id: id("CL"), name: z.string().min(1), country, joint_committee: z.string().optional(), consultant_ids: z.array(id("P")) });
export const personSchema = z.object({ id: id("P"), name: z.string().min(1), email: z.email().refine(v => v.endsWith("@example.com"), "Use a fictional @example.com address"), organisation: z.union([z.literal("SDWORX"), id("CL")]), role: z.enum(keys(vocabulary.roles)), team: z.string().optional(), countries: z.array(country).optional(), responsibilities: topics.optional(), active: z.boolean() });
export const employeeSchema = z.object({ id: id("E"), client_id: id("CL"), name: z.string().min(1), job_title: z.string().optional(), employee_category: z.enum(["white_collar", "blue_collar"]), country });
export const recordSchema = z.object({ id: id("REC"), type: z.enum(keys(vocabulary.record_types)), system: z.string().min(1), client_id: id("CL"), employee_id: id("E"), valid_from: date, valid_to: date.nullable(), known_at: time, status: z.enum(["approved", "pending", "rejected", "processed"]), approved_by: id("P").optional(), visibility, derived_from: z.array(id("REC")).default([]), facts: z.array(factSchema), note: z.string().optional() });
export const declaredSchema = z.object({ subject: id("E"), attribute: z.enum(keys(vocabulary.attributes)), value: z.union([z.number().finite(), z.string(), z.boolean()]), ...range, quote: z.string().min(1) }).superRefine((fact, ctx) => {
  if (typeof fact.value !== vocabulary.attributes[fact.attribute].type) ctx.addIssue({ code: "custom", path: ["value"], message: "Value type must match the vocabulary" });
});
export const documentSchema = z.object({ id: id("DOC"), type: z.enum(keys(vocabulary.document_types)), title: z.string().min(1), owner: id("P").nullable(), version: z.string().optional(), status: z.enum(["approved", "draft", "unverified", "superseded"]), supersedes: id("DOC").nullable().optional(), ...range, known_at: time, scope: z.object({ countries: scoped(country), client_ids: scoped(id("CL")), employee_ids: z.array(id("E")).optional() }), topics, visibility, from: correspondent.optional(), to: z.array(correspondent).optional(), sent_at: time.optional(), thread_id: id("TH").optional(), case_id: id("CASE").optional(), assertions: z.array(declaredSchema).default([]) });
export const caseSchema = z.object({
  id: id("CASE"), status: z.enum(["open", "closed", "reopened"]), question_type: z.enum(keys(vocabulary.question_types)), client_id: id("CL"), employee_id: id("E"), channel: z.enum(["ticket", "email", "phone"]), opened_at: time, deadline: date.optional(), reporter_id: id("P"), assigned_to: id("P").optional(), language: z.enum(["nl", "fr", "en"]).optional(), question_text: z.string().min(1), disputed_period: z.object({ from: date, to: date }), reported: z.object({ expected_amount: z.number().finite().optional(), received_amount: z.number().finite().optional(), currency: z.literal("EUR"), basis: z.enum(["gross", "net", "unknown"]) }).optional(), topics,
  timeline: z.array(z.object({ at: time, type: z.enum(vocabulary.timeline_event_types as [string, ...string[]]), actor_id: id("P"), description: z.string(), source_ids: z.array(idSchema) })).default([]),
  resolution: z.object({ root_cause: z.enum(keys(vocabulary.root_causes)), summary: z.string(), decided_by: id("P"), decided_at: time, source_ids: z.array(idSchema).default([]) }).optional(),
  outcome: z.object({ status: z.enum(keys(vocabulary.outcome_statuses)), confirmed_at: time.optional(), note: z.string().optional() }).optional(),
}).superRefine((value, ctx) => { if (value.status !== "open") { for (const key of ["resolution", "outcome"] as const) if (!value[key]) ctx.addIssue({ code: "custom", path: [key], message: "Required for a closed or reopened case" }); } });
export type Client = z.infer<typeof clientSchema>;
export type Person = z.infer<typeof personSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type RecordData = z.infer<typeof recordSchema>;
export type DocumentData = z.infer<typeof documentSchema> & { body: string };
export type CaseData = z.infer<typeof caseSchema>;
export type FactValue = z.infer<typeof factSchema>["value"];
export type Entity = Client | Person | Employee | RecordData | DocumentData | CaseData;
export type Dataset = { clients: Client[]; people: Person[]; employees: Employee[]; records: RecordData[]; documents: DocumentData[]; cases: CaseData[] };
