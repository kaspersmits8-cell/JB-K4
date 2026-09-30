import { expect, test } from "vitest";
import { checkData } from "../src/data/check.ts";
import { mainData, fixtureConnector } from "./helpers/data.ts";
test("optional deadlines validate calendar dates and preserve employee correspondents", () => {
  const data = mainData();
  data.cases[0].deadline = "2026-02-18";
  data.documents[1].from = "E-0001";
  data.documents[1].to = ["P-0010", "E-0001"];
  const result = checkData(fixtureConnector(data));
  expect(result.errors).toBe(0);
  expect(result.dataset.cases[0].deadline).toBe("2026-02-18");
  expect(result.dataset.documents[1].from).toBe("E-0001");
  data.cases[0].deadline = "2026-02-30";
  expect(checkData(fixtureConnector(data)).issues.some(i => i.field === "deadline" && i.severity === "error")).toBe(true);
});
test("employee correspondents must exist; owners still require a person", () => {
  const data = mainData();
  data.documents[1].from = "E-9999";
  data.documents[1].to = ["E-9998"];
  data.documents[1].owner = "E-0001";
  expect(checkData(fixtureConnector(data)).issues.some(i => i.field === "owner")).toBe(true);
  data.documents[1].owner = null;
  const issues = checkData(fixtureConnector(data)).issues;
  expect(issues.some(i => i.field === "from" && i.message.includes("E-9999"))).toBe(true);
  expect(issues.some(i => i.field === "to" && i.message.includes("E-9998"))).toBe(true);
});
