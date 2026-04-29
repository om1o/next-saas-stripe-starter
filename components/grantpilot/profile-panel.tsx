"use client";

import { Building2 } from "lucide-react";

import {
  BUDGET_TIERS,
  FOCUS_AREA_OPTIONS,
  POPULATION_OPTIONS,
  US_STATES,
} from "@/lib/grantpilot/data";
import type { NonprofitProfile } from "@/lib/grantpilot/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ProfilePanelProps {
  profile: NonprofitProfile;
  onChange: (next: NonprofitProfile) => void;
}

function MultiToggle({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={active}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfilePanel({ profile, onChange }: ProfilePanelProps) {
  const togglePopulation = (value: string) => {
    const next = profile.populationsServed.includes(value)
      ? profile.populationsServed.filter((v) => v !== value)
      : [...profile.populationsServed, value];
    onChange({ ...profile, populationsServed: next });
  };
  const toggleFocus = (value: string) => {
    const next = profile.focusAreas.includes(value)
      ? profile.focusAreas.filter((v) => v !== value)
      : [...profile.focusAreas, value];
    onChange({ ...profile, focusAreas: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          Nonprofit profile
        </CardTitle>
        <CardDescription>
          Drives fit scoring across the pipeline. Changes apply instantly —
          no save required.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="orgName">Organization</Label>
          <Input
            id="orgName"
            value={profile.organizationName}
            onChange={(e) =>
              onChange({ ...profile, organizationName: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mission">Mission</Label>
          <Textarea
            id="mission"
            rows={3}
            value={profile.mission}
            onChange={(e) => onChange({ ...profile, mission: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>State</Label>
            <Select
              value={profile.state}
              onValueChange={(value) => onChange({ ...profile, state: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Annual budget</Label>
            <Select
              value={profile.budget}
              onValueChange={(value) =>
                onChange({
                  ...profile,
                  budget: value as NonprofitProfile["budget"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_TIERS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <MultiToggle
          label="Populations served"
          options={POPULATION_OPTIONS}
          selected={profile.populationsServed}
          onToggle={togglePopulation}
        />
        <MultiToggle
          label="Focus areas"
          options={FOCUS_AREA_OPTIONS}
          selected={profile.focusAreas}
          onToggle={toggleFocus}
        />

        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <div className="mb-1 font-medium">Active filters</div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{profile.state}</Badge>
            <Badge variant="secondary">{profile.budget}</Badge>
            {profile.focusAreas.slice(0, 3).map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
            {profile.populationsServed.slice(0, 3).map((p) => (
              <Badge key={p} variant="outline">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
