"use client";

import { useMemo, useState } from "react";

import { DEFAULT_PROFILE, DEMO_GRANTS } from "@/lib/grantpilot/data";
import { scoreGrants } from "@/lib/grantpilot/fit";
import type { NonprofitProfile } from "@/lib/grantpilot/types";
import { GrantPipeline } from "@/components/grantpilot/grant-pipeline";
import { ProfilePanel } from "@/components/grantpilot/profile-panel";
import { WorkflowRunner } from "@/components/grantpilot/workflow-runner";

export function GrantPilotConsole() {
  const [profile, setProfile] = useState<NonprofitProfile>(DEFAULT_PROFILE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runToken, setRunToken] = useState<number>(0);

  const scored = useMemo(() => scoreGrants(DEMO_GRANTS, profile), [profile]);

  const triggerRun = (grantId?: string) => {
    if (grantId) setSelectedId(grantId);
    setRunToken((n) => n + 1);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <ProfilePanel profile={profile} onChange={setProfile} />
      </div>
      <div className="grid gap-4 lg:col-span-8">
        <GrantPipeline
          grants={scored}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onRunWorkflow={(id) => triggerRun(id)}
        />
        <WorkflowRunner
          profile={profile}
          selectedGrantId={selectedId}
          runToken={runToken}
        />
      </div>
    </div>
  );
}
