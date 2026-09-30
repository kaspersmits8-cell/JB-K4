import { checkData } from "../../src/data/check.ts";
import { FileConnector } from "../../src/data/connectors/file.ts";
/** Minimal guided-flow scenario derived from the contract's existing main fixture. */
export function flowData() {
  const d = structuredClone(checkData(new FileConnector("tests/fixtures/main")).dataset);
  const c = d.cases.find(c => c.id === "CASE-0001")!;
  c.deadline = "2026-02-18";
  c.timeline[0].source_ids = ["REC-0002","REC-0005","DOC-0002"];
  d.people.find(p => p.id === "P-0003")!.name = "Sarah";
  d.people.find(p => p.id === "P-0005")!.name = "Ines";
  d.people.find(p => p.id === "P-0004")!.name = "Femke";
  d.cases.find(c => c.id === "CASE-0901")!.resolution!.decided_by = "P-0005";
  const hr = d.records.find(r => r.type === "hr_master_data")!;
  hr.facts.push({attribute:"work_regime_pct",value:70});
  hr.known_at = "2026-01-15T09:00:00Z";
  d.records.find(r => r.type === "payroll_input")!.derived_from = [hr.id];
  d.documents = d.documents.filter(doc => doc.id !== "DOC-0003");
  const contract = d.records.find(r => r.id === "REC-0002")!;
  d.records.push({...contract,id:"REC-0006",valid_from:"2026-03-01",facts:[{attribute:"work_regime_pct",value:80}]});
  const procedure = d.documents.find(doc => doc.type === "procedure")!;
  d.documents.push({...procedure,id:"DOC-0004",owner:null,title:"Unowned correction procedure"});
  d.documents.push({...procedure,id:"DOC-0005",scope:{...procedure.scope,countries:["NL"]},title:"Netherlands correction procedure"});
  return d;
}
