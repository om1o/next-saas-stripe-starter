// Deterministic grant-packet generator.
//
// Produces a multi-section markdown packet (executive summary, narrative,
// budget framework, evaluation plan, timeline, attachments checklist) from a
// nonprofit profile + scored grant. No LLM call — same inputs always produce
// the same packet, which is what nonprofits want for an editable starting
// draft they can take into Word/Google Docs.
//
// When a future contributor wires Perplexity Computer / Claude / OpenAI to
// rewrite individual sections, this module should remain the structural
// scaffold so the sections, ordering, and required attachments stay
// consistent regardless of the underlying model.

import { formatUsd } from "./fit";
import type {
  GrantPacket,
  GrantPacketSection,
  NonprofitProfile,
  ScoredGrant,
} from "./types";

export function buildPacket(
  grant: ScoredGrant,
  profile: NonprofitProfile,
): GrantPacket {
  const sections: GrantPacketSection[] = [
    {
      title: "Executive Summary",
      content: buildExecutiveSummary(grant, profile),
    },
    { title: "Need Statement", content: buildNeedStatement(grant, profile) },
    { title: "Project Narrative", content: buildNarrative(grant, profile) },
    { title: "Goals & Outcomes", content: buildOutcomes(grant, profile) },
    { title: "Evaluation Plan", content: buildEvaluation(grant, profile) },
    { title: "Budget Framework", content: buildBudget(grant, profile) },
    { title: "Timeline", content: buildTimeline(grant) },
    {
      title: "Attachments Checklist",
      content: buildAttachmentsChecklist(grant),
    },
    {
      title: "Reviewer Fit Notes",
      content: buildFitNotes(grant),
    },
  ];

  return {
    grantId: grant.id,
    organizationName: profile.organizationName,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

function joinList(items: string[]): string {
  if (items.length === 0) return "the communities we serve";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function buildExecutiveSummary(
  grant: ScoredGrant,
  profile: NonprofitProfile,
): string {
  const ask = pickAsk(grant);
  return [
    `**Applicant:** ${profile.organizationName} (${profile.state})`,
    `**Opportunity:** ${grant.title} — ${grant.agency}`,
    `**Request:** ${formatUsd(ask)} over a 24-month period of performance`,
    "",
    `${profile.organizationName} respectfully requests support from ${grant.agency} to expand our work serving ${joinList(profile.populationsServed)} across ${profile.state}. This proposal directly addresses the program's focus on ${joinList(grant.focusAreas)} and will deliver measurable outcomes consistent with the funder's stated priorities.`,
  ].join("\n");
}

function buildNeedStatement(
  grant: ScoredGrant,
  profile: NonprofitProfile,
): string {
  return [
    `Communities served by ${profile.organizationName} face persistent gaps in ${joinList(grant.focusAreas)}. Local data show that ${joinList(profile.populationsServed)} are disproportionately impacted by limited access, fragmented services, and under-investment in community-based solutions.`,
    "",
    `The proposed project responds to these gaps with an evidence-informed approach grounded in ten years of community partnership. By aligning our service model with the priorities articulated in ${grant.title}, we will reach more participants, deepen impact, and contribute generalizable learning for the field.`,
  ].join("\n");
}

function buildNarrative(
  grant: ScoredGrant,
  profile: NonprofitProfile,
): string {
  const objectives = grant.focusAreas.slice(0, 3).map(
    (area, i) =>
      `${i + 1}. **${area}** — Deliver structured programming that advances participant outcomes in ${area.toLowerCase()}, in partnership with at least two community-based organizations.`,
  );
  return [
    `**Mission alignment.** ${profile.mission}`,
    "",
    "**Project objectives.**",
    ...objectives,
    "",
    `**Approach.** Activities will be delivered through a coordinated case-management model. Participants are referred through existing partner networks, complete an intake assessment, and are matched with the appropriate service track (${joinList(grant.focusAreas)}). Each participant receives wraparound supports to address barriers to engagement.`,
    "",
    `**Equity & inclusion.** Programming centers ${joinList(profile.populationsServed)} and is co-designed with community advisory members to ensure cultural responsiveness and accessibility.`,
  ].join("\n");
}

function buildOutcomes(
  grant: ScoredGrant,
  profile: NonprofitProfile,
): string {
  const target = grant.awardMax >= 1_000_000 ? 600 : 250;
  return [
    `Within the 24-month period of performance, ${profile.organizationName} will achieve the following outcomes:`,
    "",
    `- **Reach:** Serve at least ${target} unique participants from ${joinList(profile.populationsServed)}.`,
    `- **Engagement:** 80% of enrolled participants will complete at least 60% of programming.`,
    `- **Outcome:** 70% of completers will demonstrate measurable improvement on the primary outcome instrument tied to ${joinList(grant.focusAreas)}.`,
    `- **Sustainability:** Secure matching commitments equal to 25% of the federal request from local partners.`,
  ].join("\n");
}

function buildEvaluation(
  grant: ScoredGrant,
  profile: NonprofitProfile,
): string {
  return [
    `${profile.organizationName} will execute a mixed-methods evaluation in partnership with an external evaluator. Quantitative outcomes will be tracked through our case-management system using validated instruments aligned to ${joinList(grant.focusAreas)}. Qualitative learning will draw on participant focus groups and partner debriefs each quarter.`,
    "",
    "Reporting cadence:",
    "",
    "- Monthly internal program review (operational metrics, attendance, retention)",
    "- Quarterly evaluator memo to leadership and funder (outcome trend analysis)",
    "- Annual external evaluation report (impact, equity, recommendations)",
  ].join("\n");
}

function buildBudget(grant: ScoredGrant, profile: NonprofitProfile): string {
  const ask = pickAsk(grant);
  const lines = [
    ["Personnel (program staff & supervision)", 0.55],
    ["Fringe benefits", 0.12],
    ["Participant supports & stipends", 0.1],
    ["Sub-awards / community partners", 0.08],
    ["Travel & training", 0.03],
    ["Supplies & program materials", 0.04],
    ["Evaluation & data systems", 0.05],
    ["Indirect (10% de minimis)", 0.03],
  ] as const;
  const rows = lines.map(([label, share]) => {
    const amount = Math.round((ask * share) / 1000) * 1000;
    return `| ${label} | ${formatUsd(amount)} | ${(share * 100).toFixed(0)}% |`;
  });
  return [
    `Total federal request: **${formatUsd(ask)}** over 24 months. Match commitment of ~25% from ${profile.organizationName} general operating funds and confirmed local partners.`,
    "",
    "| Category | Amount | % of total |",
    "| --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function buildTimeline(grant: ScoredGrant): string {
  return [
    "**Pre-award (next 30 days):** Finalize partner MOUs, IRB protocol if required, evaluator contracting.",
    "",
    "**Months 1–3:** Hire program staff, launch participant recruitment, baseline data collection.",
    "",
    "**Months 4–12:** Steady-state programming, mid-year formative evaluation, partner roundtable.",
    "",
    "**Months 13–18:** Refine model based on year-1 evidence, expand cohort, dissemination plan.",
    "",
    "**Months 19–24:** Final outcome data collection, summative evaluation, sustainability commitments secured.",
    "",
    `Submission deadline: **${grant.deadline}**.`,
  ].join("\n");
}

function buildAttachmentsChecklist(grant: ScoredGrant): string {
  return [
    "- [ ] SF-424 Application for Federal Assistance",
    "- [ ] SF-424A Budget Information (Non-Construction)",
    "- [ ] SF-424B Assurances (Non-Construction)",
    "- [ ] Project Abstract (1 page)",
    "- [ ] Project Narrative (page limit per RFP)",
    "- [ ] Detailed Budget & Justification",
    "- [ ] Logic Model / Evaluation Plan",
    "- [ ] Letters of Commitment from partners",
    "- [ ] Resumes / position descriptions for key personnel",
    "- [ ] Indirect cost rate agreement (or de minimis attestation)",
    "- [ ] IRS 501(c)(3) determination letter",
    `- [ ] Funder-specific attachments per ${grant.agency} RFP`,
  ].join("\n");
}

function buildFitNotes(grant: ScoredGrant): string {
  const reasons = grant.fit.reasons.map((r) => `- ${r}`).join("\n");
  return [
    `**Overall fit score:** ${grant.fit.total}/100`,
    "",
    `Component breakdown — focus ${grant.fit.focus}, population ${grant.fit.population}, geography ${grant.fit.geography}, budget ${grant.fit.budget}.`,
    "",
    "**Reasoning:**",
    reasons,
  ].join("\n");
}

function pickAsk(grant: ScoredGrant): number {
  // Aim near the midpoint, but biased slightly under so the ask reads
  // realistic against the typical award.
  const mid = Math.round((grant.awardMin + grant.awardMax) / 2);
  return Math.round(mid / 1000) * 1000;
}

export function packetToMarkdown(packet: GrantPacket): string {
  const header = [
    `# ${packet.organizationName} — Grant Packet`,
    `*Generated by GrantPilot · ${new Date(packet.generatedAt).toUTCString()}*`,
    `*Opportunity ID: ${packet.grantId}*`,
    "",
  ].join("\n");
  const body = packet.sections
    .map((s) => `## ${s.title}\n\n${s.content}\n`)
    .join("\n");
  return `${header}\n${body}`;
}
