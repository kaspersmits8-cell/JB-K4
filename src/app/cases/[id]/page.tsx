import { notFound, redirect } from "next/navigation";
import { currentUser } from "../../../server/session.ts";
import { getStorage } from "../../../server/storage.ts";
import { Repository } from "../../../server/repo/index.ts";
import { getAnalysis } from "../../../server/services/analysis.ts";
import { AppError } from "../../../server/errors.ts";
import { draftClientReply, draftExplanation, draftExpertQuestion } from "../../../ai/tasks/drafts.ts";
import { Dossier } from "../../../ui/Dossier.tsx";
export const dynamic = "force-dynamic";
export default async function DossierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ exclude?: string | string[] }> }) {
  const user = await currentUser(); if (!user) redirect("/login");
  const id = (await params).id, query = await searchParams;
  let result;
  try { result = getAnalysis(new Repository(getStorage()), user, id, query.exclude || ""); }
  catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  const [reply, explanation, questions] = await Promise.all([draftClientReply(result.analysis), draftExplanation(result.analysis), Promise.all(result.analysis.experts.map(async expert => ({ id: expert.person.id, draft: await draftExpertQuestion(result.analysis, expert.person.id) })))]);
  return <Dossier result={result} user={user} reply={reply} explanation={explanation} expertQuestions={questions} />;
}
