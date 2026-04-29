import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DEMO_GRANTS, DEFAULT_PROFILE } from "@/lib/grantpilot/data";
import { scoreGrants, daysUntil, formatUsd } from "@/lib/grantpilot/fit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
  title: "Dashboard – GrantPilot",
  description: "AI grant writing copilot for nonprofits.",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const scored = scoreGrants(DEMO_GRANTS, DEFAULT_PROFILE).slice(0, 4);
  const ceiling = DEMO_GRANTS.reduce((acc, g) => acc + g.awardMax, 0);
  const nextDeadline = DEMO_GRANTS.map((g) => daysUntil(g.deadline))
    .filter((d) => d >= 0)
    .sort((a, b) => a - b)[0];

  return (
    <>
      <DashboardHeader
        heading={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        text="Your nonprofit's grant pipeline at a glance — jump straight into GrantPilot to draft."
      >
        <Link href="/dashboard/grantpilot">
          <Button>
            <Icons.sparkles className="mr-2 size-4" />
            Open GrantPilot
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open opportunities</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {DEMO_GRANTS.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Federal, state &amp; foundation feeds
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Next deadline</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {nextDeadline ?? "—"}d
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Until the soonest application closes
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pipeline ceiling</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatUsd(ceiling)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total max award across the pipeline
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top fit for your profile</CardTitle>
          <CardDescription>
            Demo profile: {DEFAULT_PROFILE.organizationName} · {DEFAULT_PROFILE.state}
            . Update the profile inside GrantPilot to re-rank.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {scored.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{g.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {g.agency} · due in {daysUntil(g.deadline)}d
                  </div>
                </div>
                <Badge variant="secondary">{g.fit.total}/100</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatUsd(g.awardMin)}–{formatUsd(g.awardMax)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Link href="/dashboard/grantpilot">
              <Button variant="outline" size="sm">
                View full pipeline →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
