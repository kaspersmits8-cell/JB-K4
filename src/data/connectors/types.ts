export type SourceInput = { file: string; kind: "clients" | "people" | "employees" | "records" | "documents" | "cases"; raw: unknown; body?: string };
export type Issue = { file: string; severity: "error" | "warn"; field: string; message: string; hint: string };
export interface Connector { read(): { sources: SourceInput[]; issues: Issue[]; fileCount: number } }
