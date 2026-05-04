// Demo grant opportunity catalog used in GrantPilot's pipeline.
//
// These records are realistic in shape (modeled on Grants.gov / SAM.gov
// opportunity records) but are static so the app runs without any external
// API key. Replace this module with a live fetcher (see lib/grantpilot/live.ts
// scaffold) when wiring real data sources.
//
// Data sources referenced for the field shape:
//   https://www.grants.gov/api
//   https://open.gsa.gov/api/get-opportunities-public-api/
//   https://open.gsa.gov/api/assistance-listings-api/

import type { GrantOpportunity, NonprofitProfile } from "./types";

// Deadlines are produced from a fixed reference date so the demo is stable
// in tests and screenshots. The UI re-renders relative dates against now().
const REF_DATE = new Date("2026-04-29T00:00:00.000Z");
function offset(days: number): string {
  const d = new Date(REF_DATE);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const DEMO_GRANTS: GrantOpportunity[] = [
  {
    id: "GP-2026-001",
    title: "Community Mental Health Services Block Grant",
    agency: "SAMHSA · HHS",
    source: "Grants.gov",
    deadline: offset(21),
    awardMin: 250_000,
    awardMax: 1_500_000,
    focusAreas: ["Mental Health", "Public Health", "Youth Services"],
    eligibleStates: [],
    populations: ["Youth", "Low-income families", "BIPOC communities"],
    summary:
      "Formula block grant supporting community mental health services for adults with serious mental illness and children with serious emotional disturbance.",
    url: "https://www.grants.gov/search-results-detail/SAMHSA-CMHS-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-002",
    title: "Workforce Innovation & Opportunity Act — Youth Pathways",
    agency: "U.S. Department of Labor",
    source: "Grants.gov",
    deadline: offset(34),
    awardMin: 500_000,
    awardMax: 3_000_000,
    focusAreas: ["Workforce Development", "Youth Services", "Education"],
    eligibleStates: [],
    populations: ["Youth", "Opportunity Youth", "Justice-impacted"],
    summary:
      "Competitive grants to expand career pathways, paid work experiences, and supportive services for opportunity youth ages 16–24.",
    url: "https://www.grants.gov/search-results-detail/DOL-WIOA-Youth-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-003",
    title: "Rural Health Network Development Program",
    agency: "HRSA · HHS",
    source: "Grants.gov",
    deadline: offset(12),
    awardMin: 150_000,
    awardMax: 300_000,
    focusAreas: ["Public Health", "Rural Communities", "Healthcare Access"],
    eligibleStates: ["MT", "WY", "ND", "SD", "ID"],
    populations: ["Rural residents", "Medically underserved"],
    summary:
      "Develops integrated rural health networks that achieve efficiencies, expand access, and improve quality for rural populations.",
    url: "https://www.grants.gov/search-results-detail/HRSA-RHND-2026",
    status: "researching",
  },
  {
    id: "GP-2026-004",
    title: "Environmental Justice Collaborative Problem-Solving",
    agency: "U.S. EPA",
    source: "Grants.gov",
    deadline: offset(48),
    awardMin: 75_000,
    awardMax: 500_000,
    focusAreas: ["Environment", "Climate", "Community Organizing"],
    eligibleStates: [],
    populations: ["Frontline communities", "Low-income families", "BIPOC communities"],
    summary:
      "Supports community-based organizations addressing local environmental and public health issues through collaborative problem-solving.",
    url: "https://www.grants.gov/search-results-detail/EPA-EJCPS-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-005",
    title: "Innovative Approaches to Literacy",
    agency: "U.S. Department of Education",
    source: "Grants.gov",
    deadline: offset(60),
    awardMin: 200_000,
    awardMax: 1_000_000,
    focusAreas: ["Education", "Literacy", "Youth Services"],
    eligibleStates: [],
    populations: ["Children K-12", "Low-income families"],
    summary:
      "Promotes literacy programs and high-quality book distribution for children and adolescents from low-income households.",
    url: "https://www.grants.gov/search-results-detail/ED-IAL-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-006",
    title: "Affordable Housing Capacity Building",
    agency: "HUD",
    source: "Grants.gov",
    deadline: offset(7),
    awardMin: 100_000,
    awardMax: 750_000,
    focusAreas: ["Housing", "Community Development"],
    eligibleStates: [],
    populations: ["Unhoused", "Low-income families"],
    summary:
      "Builds the capacity of community housing development organizations to expand the supply of affordable housing for low-income households.",
    url: "https://www.grants.gov/search-results-detail/HUD-CHDO-2026",
    status: "drafting",
  },
  {
    id: "GP-2026-007",
    title: "Food Insecurity Nutrition Incentive (GusNIP)",
    agency: "USDA NIFA",
    source: "Grants.gov",
    deadline: offset(28),
    awardMin: 250_000,
    awardMax: 2_500_000,
    focusAreas: ["Food Security", "Public Health", "Community Development"],
    eligibleStates: [],
    populations: ["SNAP recipients", "Low-income families", "Seniors"],
    summary:
      "Incentive grants that increase fruit and vegetable purchases among SNAP participants by providing point-of-purchase incentives.",
    url: "https://www.grants.gov/search-results-detail/USDA-GusNIP-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-008",
    title: "Arts Partners — Underserved Communities",
    agency: "National Endowment for the Arts",
    source: "Grants.gov",
    deadline: offset(40),
    awardMin: 25_000,
    awardMax: 150_000,
    focusAreas: ["Arts & Culture", "Youth Services", "Community Development"],
    eligibleStates: [],
    populations: ["Youth", "BIPOC communities", "Rural residents"],
    summary:
      "Project grants supporting arts engagement and education in communities historically underserved by federal cultural funding.",
    url: "https://www.grants.gov/search-results-detail/NEA-AP-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-009",
    title: "Strengthening Veteran Reintegration Services",
    agency: "VA",
    source: "Grants.gov",
    deadline: offset(55),
    awardMin: 200_000,
    awardMax: 1_200_000,
    focusAreas: ["Veterans Services", "Mental Health", "Workforce Development"],
    eligibleStates: [],
    populations: ["Veterans", "Justice-impacted"],
    summary:
      "Wraparound services for veterans transitioning from active duty, including mental health, employment, and housing supports.",
    url: "https://www.grants.gov/search-results-detail/VA-SVR-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-010",
    title: "Childcare Access Means Parents in School (CCAMPIS)",
    agency: "U.S. Department of Education",
    source: "Grants.gov",
    deadline: offset(75),
    awardMin: 100_000,
    awardMax: 500_000,
    focusAreas: ["Education", "Family Services", "Workforce Development"],
    eligibleStates: [],
    populations: ["Low-income families", "Single parents"],
    summary:
      "Supports the participation of low-income parents in postsecondary education by providing campus-based childcare services.",
    url: "https://www.grants.gov/search-results-detail/ED-CCAMPIS-2026",
    status: "discovered",
  },
  {
    id: "GP-2026-011",
    title: "Neighborhood Resilience Hubs",
    agency: "California Strategic Growth Council",
    source: "State",
    deadline: offset(18),
    awardMin: 500_000,
    awardMax: 5_000_000,
    focusAreas: ["Climate", "Environment", "Community Development"],
    eligibleStates: ["CA"],
    populations: ["Frontline communities", "Low-income families", "Seniors"],
    summary:
      "Capital and programming for community resilience hubs that provide services year-round and emergency response during climate events.",
    url: "https://sgc.ca.gov/programs/neighborhood-resilience-hubs",
    status: "researching",
  },
  {
    id: "GP-2026-012",
    title: "Tech Inclusion for Older Adults",
    agency: "AARP Foundation",
    source: "Foundation",
    deadline: offset(45),
    awardMin: 25_000,
    awardMax: 100_000,
    focusAreas: ["Aging", "Digital Equity", "Workforce Development"],
    eligibleStates: [],
    populations: ["Seniors", "Low-income families"],
    summary:
      "Supports community programs that help older adults gain digital skills, broadband access, and employment-relevant technology fluency.",
    url: "https://www.aarp.org/aarp-foundation/grants",
    status: "discovered",
  },
];

export const DEFAULT_PROFILE: NonprofitProfile = {
  organizationName: "Bright Futures Coalition",
  mission:
    "We expand opportunity for low-income youth through after-school enrichment, college access coaching, and family wraparound services.",
  state: "CA",
  budget: "$500K-$2M",
  populationsServed: ["Youth", "Low-income families", "BIPOC communities"],
  focusAreas: ["Education", "Youth Services", "Workforce Development"],
  yearFounded: 2014,
};

export const FOCUS_AREA_OPTIONS = [
  "Arts & Culture",
  "Aging",
  "Climate",
  "Community Development",
  "Community Organizing",
  "Digital Equity",
  "Education",
  "Environment",
  "Family Services",
  "Food Security",
  "Healthcare Access",
  "Housing",
  "Literacy",
  "Mental Health",
  "Public Health",
  "Rural Communities",
  "Veterans Services",
  "Workforce Development",
  "Youth Services",
];

export const POPULATION_OPTIONS = [
  "BIPOC communities",
  "Children K-12",
  "Frontline communities",
  "Justice-impacted",
  "Low-income families",
  "Medically underserved",
  "Opportunity Youth",
  "Rural residents",
  "Seniors",
  "Single parents",
  "SNAP recipients",
  "Unhoused",
  "Veterans",
  "Youth",
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY",
];

export const BUDGET_TIERS: NonprofitProfile["budget"][] = [
  "<$100K",
  "$100K-$500K",
  "$500K-$2M",
  "$2M-$10M",
  ">$10M",
];
