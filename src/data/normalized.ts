import type { Dataset, DocumentData, RecordData, FactValue } from "./schemas.ts";
export type Source = { id: string; kind: "record"; data: RecordData } | { id: string; kind: "document"; data: DocumentData };
export type Fragment = { id: string; sourceId: string; text: string; start: number; end: number };
export type Assertion = { id: string; sourceId: string; subjectId: string; attribute: string; value: FactValue; validFrom: string | null; validTo: string | null; origin: "structured" | "declared"; locator: { fragmentId: string; field?: string; quote?: string; start?: number; end?: number } };
export function normalize(dataset: Dataset) {
  const sources: Source[] = [], fragments: Fragment[] = [], assertions: Assertion[] = [];
  for (const record of dataset.records) {
    sources.push({ id: record.id, kind: "record", data: record });
    record.facts.forEach((fact, i) => {
      const id = `${record.id}#facts[${i}]`;
      fragments.push({ id, sourceId: record.id, text: JSON.stringify(fact), start: 0, end: 0 });
      assertions.push({ id, sourceId: record.id, subjectId: record.employee_id, attribute: fact.attribute, value: fact.value, validFrom: record.valid_from, validTo: record.valid_to, origin: "structured", locator: { fragmentId: id, field: `facts[${i}]` } });
    });
  }
  for (const document of dataset.documents) {
    sources.push({ id: document.id, kind: "document", data: document });
    const docFragments: Fragment[] = [];
    // Retain exact offsets rather than normalising whitespace or line endings.
    const sections = /[^\r\n]+(?:\r?\n(?!\r?\n|#{1,6} )[^\r\n]+)*/g;
    for (const match of document.body.matchAll(sections)) docFragments.push({ id: `${document.id}#f${docFragments.length + 1}`, sourceId: document.id, text: match[0], start: match.index, end: match.index + match[0].length });
    document.assertions.forEach((assertion, i) => {
      const start = document.body.indexOf(assertion.quote), end = start + assertion.quote.length;
      let fragment = docFragments.find(f => f.start <= start && f.end >= end);
      if (!fragment) { fragment = { id: `${document.id}#f${docFragments.length + 1}`, sourceId: document.id, text: assertion.quote, start, end }; docFragments.push(fragment); }
      assertions.push({ id: `${document.id}#assertions[${i}]`, sourceId: document.id, subjectId: assertion.subject, attribute: assertion.attribute, value: assertion.value, validFrom: assertion.valid_from, validTo: assertion.valid_to, origin: "declared", locator: { fragmentId: fragment.id, quote: assertion.quote, start, end } });
    });
    fragments.push(...docFragments);
  }
  return { sources, fragments, assertions };
}
