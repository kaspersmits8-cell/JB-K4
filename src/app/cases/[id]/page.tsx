import { loadFlow, type FlowPageProps } from "../../../server/services/flow.ts";
import { FlowFrame } from "../../../ui/FlowFrame.tsx";
import { Question } from "../../../ui/Question.tsx";
export const dynamic = "force-dynamic";
export default async function Page(props: FlowPageProps) {
  const data = await loadFlow(props);
  return <FlowFrame data={data} step="question"><Question data={data} /></FlowFrame>;
}
