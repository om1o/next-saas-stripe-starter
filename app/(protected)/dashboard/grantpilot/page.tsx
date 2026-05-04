import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { GrantPilotConsole } from "@/components/grantpilot/grantpilot-console";

export const metadata = constructMetadata({
  title: "GrantPilot – AI grant writing copilot",
  description:
    "Discover, score, and draft federal & foundation grants in minutes. Built for nonprofits.",
});

export default function GrantPilotPage() {
  return (
    <>
      <DashboardHeader
        heading="GrantPilot"
        text="AI grant-writing copilot for nonprofits — discover, score, and draft in one workflow."
      />
      <GrantPilotConsole />
    </>
  );
}
