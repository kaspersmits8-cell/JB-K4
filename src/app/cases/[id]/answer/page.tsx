import { loadFlow, type FlowPageProps } from "../../../../server/services/flow.ts";
import { draftExpertQuestion } from "../../../../ai/tasks/drafts.ts";
import { FlowFrame } from "../../../../ui/FlowFrame.tsx";
import { Answer } from "../../../../ui/Answer.tsx";
export const dynamic = "force-dynamic";
export default async function Page(props: FlowPageProps) {
  const data = await loadFlow(props);
  const questions = await Promise.all(data.result.analysis.experts.map(async expert => ({ id:expert.person.id, draft:await draftExpertQuestion(data.result.analysis,expert.person.id) })));
  return <FlowFrame data={data} step="answer"><Answer data={data} questions={questions} /></FlowFrame>;
}
