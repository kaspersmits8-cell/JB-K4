import { loadFlow, type FlowPageProps } from "../../../../server/services/flow.ts";
import { draftClientReply } from "../../../../ai/tasks/drafts.ts";
import { FlowFrame } from "../../../../ui/FlowFrame.tsx";
import { Respond } from "../../../../ui/Respond.tsx";
export const dynamic = "force-dynamic";
export default async function Page(props: FlowPageProps) {
  const data = await loadFlow(props);
  const reply = await draftClientReply(data.result.analysis);
  return <FlowFrame data={data} step="respond"><Respond data={data} reply={reply} /></FlowFrame>;
}
