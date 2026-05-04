// Shared types for the GrantPilot domain.
//
// GrantPilot is an AI grant-writing copilot for nonprofits. The shape below is
// designed to model the public data exposed by Grants.gov / SAM.gov
// (opportunities, assistance listings, agencies, deadlines) and the local
// nonprofit profile that drives fit scoring and narrative generation.

export type GrantStatus =
  | "discovered"
  | "researching"
  | "drafting"
  | "ready"
  | "submitted"
  | "passed";

export type GrantSource =
  | "Grants.gov"
  | "SAM.gov"
  | "GSA Assistance Listings"
  | "State"
  | "Foundation"
  | "Local";

export interface GrantOpportunity {
  id: string;
  title: string;
  agency: string;
  source: GrantSource;
  /** ISO date string. */
  deadline: string;
  awardMin: number;
  awardMax: number;
  focusAreas: string[];
  eligibleStates: string[]; // empty array = nationwide
  populations: string[];
  summary: string;
  url: string;
  status: GrantStatus;
}

export type NonprofitBudgetTier =
  | "<$100K"
  | "$100K-$500K"
  | "$500K-$2M"
  | "$2M-$10M"
  | ">$10M";

export interface NonprofitProfile {
  organizationName: string;
  mission: string;
  state: string;
  budget: NonprofitBudgetTier;
  populationsServed: string[];
  focusAreas: string[];
  ein?: string;
  yearFounded?: number;
}

export interface GrantFitScore {
  total: number; // 0-100
  focus: number;
  population: number;
  geography: number;
  budget: number;
  reasons: string[];
}

export interface ScoredGrant extends GrantOpportunity {
  fit: GrantFitScore;
}

export interface GrantPacketSection {
  title: string;
  content: string; // markdown
}

export interface GrantPacket {
  grantId: string;
  organizationName: string;
  generatedAt: string;
  sections: GrantPacketSection[];
}
