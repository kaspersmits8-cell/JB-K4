import { loadFlow, type FlowPageProps } from "../../../server/services/flow.ts";
import { FlowFrame } from "../../../ui/FlowFrame.tsx";
import { flowCopy } from "../../../ui/copy.ts";
export const dynamic = "force-dynamic";
export default async function Page(props: FlowPageProps) {
  const data = await loadFlow(props);
  return <FlowFrame data={data} step="question"><h1>{flowCopy.steps.question}</h1></FlowFrame>;
}
