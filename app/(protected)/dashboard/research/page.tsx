import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { ResearchConsole } from "@/components/research/research-console";

export const metadata = constructMetadata({
  title: "Research Agent – SaaS Starter",
  description:
    "Agentic research console with planner, web search, and synthesis steps.",
});

export default function ResearchPage() {
  return (
    <>
      <DashboardHeader
        heading="Research Agent"
        text="Plan → search → reason → synthesize. Streams structured agent steps over SSE."
      />
      <ResearchConsole />
    </>
  );
}
