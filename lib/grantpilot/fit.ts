// Deterministic grant fit scorer.
//
// We score each opportunity 0-100 against the active nonprofit profile across
// four dimensions (focus alignment, population alignment, geographic
// eligibility, budget appropriateness). The breakdown is shown in the UI so
// program officers can sanity-check why a grant ranked the way it did.
//
// Scoring is intentionally local + deterministic: same profile + same grant
// → same score, with no LLM calls. This mirrors the philosophy in
// lib/agents/synthesizer.ts and keeps the demo fully offline.

import type {
  GrantFitScore,
  GrantOpportunity,
  NonprofitProfile,
  ScoredGrant,
} from "./types";

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sa = new Set(a.map((x) => x.toLowerCase()));
  const sb = new Set(b.map((x) => x.toLowerCase()));
  let inter = 0;
  sa.forEach((v) => {
    if (sb.has(v)) inter += 1;
  });
  const union = new Set<string>();
  sa.forEach((v) => union.add(v));
  sb.forEach((v) => union.add(v));
  return inter / union.size;
}

const BUDGET_BANDS: Record<NonprofitProfile["budget"], [number, number]> = {
  "<$100K": [10_000, 150_000],
  "$100K-$500K": [50_000, 500_000],
  "$500K-$2M": [150_000, 2_500_000],
  "$2M-$10M": [500_000, 10_000_000],
  ">$10M": [1_000_000, 50_000_000],
};

function budgetOverlap(
  award: { min: number; max: number },
  budget: NonprofitProfile["budget"],
): number {
  const [lo, hi] = BUDGET_BANDS[budget];
  const overlapLo = Math.max(award.min, lo);
  const overlapHi = Math.min(award.max, hi);
  if (overlapHi <= overlapLo) return 0;
  const overlap = overlapHi - overlapLo;
  const span = Math.max(award.max - award.min, hi - lo, 1);
  return Math.min(1, overlap / span);
}

export function scoreGrant(
  grant: GrantOpportunity,
  profile: NonprofitProfile,
): GrantFitScore {
  const focus = jaccard(grant.focusAreas, profile.focusAreas);
  const population = jaccard(grant.populations, profile.populationsServed);
  const geography =
    grant.eligibleStates.length === 0 ||
    grant.eligibleStates.includes(profile.state)
      ? 1
      : 0;
  const budget = budgetOverlap(
    { min: grant.awardMin, max: grant.awardMax },
    profile.budget,
  );

  // Weights: focus 35, population 30, geography 20, budget 15
  const total = Math.round(
    100 *
      (0.35 * focus + 0.3 * population + 0.2 * geography + 0.15 * budget),
  );

  const reasons: string[] = [];
  if (focus > 0) {
    const overlap = grant.focusAreas.filter((f) =>
      profile.focusAreas.some((p) => p.toLowerCase() === f.toLowerCase()),
    );
    if (overlap.length > 0) reasons.push(`Focus match: ${overlap.join(", ")}`);
  } else {
    reasons.push("Focus areas do not overlap with the org profile.");
  }
  if (population > 0) {
    const overlap = grant.populations.filter((p) =>
      profile.populationsServed.some(
        (q) => q.toLowerCase() === p.toLowerCase(),
      ),
    );
    if (overlap.length > 0)
      reasons.push(`Serves: ${overlap.join(", ")}`);
  }
  if (geography === 1) {
    reasons.push(
      grant.eligibleStates.length === 0
        ? "Nationwide eligibility."
        : `Eligible in ${profile.state}.`,
    );
  } else {
    reasons.push(
      `Restricted to ${grant.eligibleStates.join(", ")}; org is in ${profile.state}.`,
    );
  }
  if (budget > 0) {
    reasons.push(
      `Award band ${formatUsd(grant.awardMin)}–${formatUsd(grant.awardMax)} fits a ${profile.budget} budget.`,
    );
  } else {
    reasons.push(
      `Award band ${formatUsd(grant.awardMin)}–${formatUsd(grant.awardMax)} is outside a ${profile.budget} budget.`,
    );
  }

  return {
    total,
    focus: Math.round(100 * focus),
    population: Math.round(100 * population),
    geography: Math.round(100 * geography),
    budget: Math.round(100 * budget),
    reasons,
  };
}

export function scoreGrants(
  grants: GrantOpportunity[],
  profile: NonprofitProfile,
): ScoredGrant[] {
  return grants
    .map((g) => ({ ...g, fit: scoreGrant(g, profile) }))
    .sort((a, b) => b.fit.total - a.fit.total);
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function daysUntil(iso: string, from: Date = new Date()): number {
  const d = new Date(iso + "T00:00:00.000Z").getTime();
  const now = from.getTime();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}
