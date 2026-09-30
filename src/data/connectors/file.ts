import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Connector, SourceInput, Issue } from "./types.ts";
export class FileConnector implements Connector {
  root: string;
  constructor(root: string) { this.root = root; }
  read() {
    const sources: SourceInput[] = [], issues: Issue[] = [];
    let fileCount = 0;
    const read = (file: string, kind: SourceInput["kind"]) => {
      fileCount++;
      try {
        const text = readFileSync(path.join(this.root, file), "utf8");
        if (kind === "documents") { const parsed = matter(text); sources.push({ file, kind, raw: parsed.data, body: parsed.content }); }
        else {
          const raw: unknown = JSON.parse(text);
          if (["clients", "people", "employees"].includes(kind) && !Array.isArray(raw)) throw new Error("Expected a JSON array");
          for (const entry of (Array.isArray(raw) ? raw : [raw])) sources.push({ file, kind, raw: entry });
        }
      } catch (error) { issues.push({ file, severity: "error", field: "", message: error instanceof Error ? error.message : "Unable to read file", hint: "Check the file exists and fix its JSON/YAML syntax." }); }
    };
    for (const kind of ["clients", "people", "employees"] as const) read(`${kind}.json`, kind);
    for (const kind of ["records", "documents", "cases"] as const) {
      const dir = path.join(this.root, kind);
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isFile() && entry.name.endsWith(kind === "documents" ? ".md" : ".json")) read(`${kind}/${entry.name}`, kind);
      }
    }
    return { sources, issues, fileCount };
  }
}
