import { notFound, redirect } from "next/navigation";
import { currentUser } from "../session.ts";
import { getStorage } from "../storage.ts";
import { Repository } from "../repo/index.ts";
import { casePresentation } from "../repo/presentation.ts";
import { getAnalysis, caseIdSchema } from "./analysis.ts";
import { AppError } from "../errors.ts";
import { flowQuerySchema } from "../../ui/flow-query.ts";
export type FlowPageProps = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function loadFlow(props: FlowPageProps) {
  const user = await currentUser(); if (!user) redirect("/login");
  const id = caseIdSchema.safeParse((await props.params).id), query = flowQuerySchema.safeParse(await props.searchParams);
  if (!id.success || !query.success) notFound();
  const repo = new Repository(getStorage());
  try {
    const result = getAnalysis(repo, user, id.data, query.data.exclude);
    const presentation = casePresentation(repo, user, id.data)!;
    if (query.data.source && !repo.getSource(user, query.data.source)) notFound();
    return { user, result, presentation, query: query.data };
  } catch (error) { if (error instanceof AppError && [400,404].includes(error.status)) notFound(); throw error; }
}
export type FlowData = Awaited<ReturnType<typeof loadFlow>>;
