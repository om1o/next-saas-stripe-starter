<a href="https://next-saas-stripe-starter.vercel.app">
  <img alt="SaaS Starter" src="public/_static/og.jpg">
  <h1 align="center">Next SaaS Stripe Starter</h1>
</a>

<p align="center">
  Start at full speed with SaaS Starter !
</p>

<p align="center">
  <a href="https://twitter.com/miickasmt">
    <img src="https://img.shields.io/twitter/follow/miickasmt?style=flat&label=miickasmt&logo=twitter&color=0bf&logoColor=fff" alt="Mickasmt Twitter follower count" />
  </a>
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> ·
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#tech-stack--features"><strong>Tech Stack + Features</strong></a> ·
  <a href="#author"><strong>Author</strong></a> ·
  <a href="#credits"><strong>Credits</strong></a>
</p>
<br/>

## Introduction

Empower your next project with the stack of Next.js 14, Prisma, Neon, Auth.js v5, Resend, React Email, Shadcn/ui, and Stripe.
<br/>
All seamlessly integrated with the SaaS Starter to accelerate your development and saas journey.

## Installation

Clone & create this repo locally with the following command:

```bash
npx create-next-app my-saas-project --example "https://github.com/mickasmt/next-saas-stripe-starter"
```

Or, deploy with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmickasmt%2Fnext-saas-stripe-starter)

### Steps

1. Install dependencies using pnpm:

```sh
pnpm install
```

2. Copy `.env.example` to `.env.local` and update the variables.

```sh
cp .env.example .env.local
```

3. Start the development server:

```sh
pnpm run dev
```

> [!NOTE]  
> I use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) package for update this project.
>
> Use this command for update your project: `ncu -i --format group`

## GrantPilot

GrantPilot is the headline product built on top of this starter: an AI grant
writing copilot for nonprofits. It lives at `/dashboard/grantpilot` and
ships in **demo mode** — every feature works without any external API keys.

### What you get

- **Nonprofit profile panel.** Mission, state, annual budget, focus areas, and
  populations served. Edits re-rank the pipeline in real time.
- **Grant pipeline.** Twelve realistic federal / state / foundation
  opportunities (modeled on the Grants.gov & SAM.gov field shapes) ranked by a
  deterministic fit scorer. Filters by status (discovered → researching →
  drafting → ready → submitted).
- **Fit score breakdown.** Each grant gets a 0–100 score plus per-axis
  components (focus, population, geography, budget) and human-readable reasons
  so program officers can sanity-check the rank.
- **Agentic workflow.** A streamed `discover → shortlist → research → outline
  → narrative → budget → packet` pipeline rendered live over Server-Sent
  Events. Architecture mirrors the Research Agent below.
- **Export-ready packet.** A 9-section grant-packet draft (executive summary,
  need statement, project narrative, goals & outcomes, evaluation plan, budget
  framework, timeline, attachments checklist, reviewer fit notes). Download as
  Markdown / plain text, or open the Print → Save-as-PDF flow in the browser.

### Source-repo influences (used conceptually, not vendored)

| Area | Source repo / docs | How it shaped GrantPilot |
| --- | --- | --- |
| Dashboard styling | [`tremorlabs/tremor`](https://github.com/tremorlabs/tremor), [`cruip/tailwind-dashboard-template`](https://github.com/cruip/tailwind-dashboard-template), [`horizon-ui/horizon-ui-chakra`](https://github.com/horizon-ui/horizon-ui-chakra) | Visual language for KPI cards, status pills, and pipeline list. We use shadcn/ui + Tailwind primitives (already in the starter) instead of adding another UI framework. |
| Document generation | [`react-pdf`](https://github.com/diegomura/react-pdf), [`docxtemplater`](https://github.com/open-xml-templating/docxtemplater) | Inspired the "export packet" affordances. Implemented as Markdown / plain-text downloads + browser Print-to-PDF; binary `.pdf` / `.docx` generation is left as a follow-up to keep the runtime dependency-free. |
| Auth | [`nextauthjs/next-auth`](https://github.com/nextauthjs/next-auth) | Already used by the starter (Auth.js v5). Clerk was considered ([`clerk/clerk-nextjs-starter`](https://github.com/clerk/clerk-nextjs-starter)) but **not added** — Auth.js already covers our needs. |
| Grant data | [Grants.gov API](https://www.grants.gov/api), [GSA Get Opportunities API](https://open.gsa.gov/api/get-opportunities-public-api/), [Assistance Listings](https://open.gsa.gov/api/assistance-listings-api/), [`unitedstates/congress`](https://github.com/unitedstates/congress) | Field shape for `GrantOpportunity` (agency, focus areas, populations, deadlines, eligible states, award range) is modeled to slot into a real Grants.gov fetch. Live fetch is a future hook; the demo dataset is intentionally static. |
| Research / scraping | [`assafelovic/gpt-researcher`](https://github.com/assafelovic/gpt-researcher), [`unclecode/crawl4ai`](https://github.com/unclecode/crawl4ai), [`apify/crawlee`](https://github.com/apify/crawlee) | Planner → search → synthesize pipeline pattern (also used by the Research Agent below). GrantPilot's workflow uses the same SSE event shape so future contributors can plug a real retriever in. |
| Agent orchestration | [`langchain-ai/langchainjs`](https://github.com/langchain-ai/langchainjs) | Streamed step events / typed tool abstractions. We did not add LangChain as a dependency — instead we ported the SSE event pattern. |

### Key files

- `lib/grantpilot/types.ts` — domain types (`GrantOpportunity`,
  `NonprofitProfile`, `GrantFitScore`, `GrantPacket`).
- `lib/grantpilot/data.ts` — demo grant catalog + default profile +
  option lists for the profile form.
- `lib/grantpilot/fit.ts` — deterministic fit scorer (focus 35% / population
  30% / geography 20% / budget 15%) plus formatters.
- `lib/grantpilot/packet.ts` — 9-section markdown packet generator.
- `lib/grantpilot/workflow.ts` — async-generator workflow that yields
  `WorkflowEvent`s for the SSE endpoint.
- `app/api/grantpilot/route.ts` — authenticated SSE endpoint.
- `app/(protected)/dashboard/grantpilot/page.tsx` — dashboard page.
- `components/grantpilot/profile-panel.tsx` — left-rail profile editor.
- `components/grantpilot/grant-pipeline.tsx` — pipeline cards with fit
  meters, deadline pills, and status filters.
- `components/grantpilot/workflow-runner.tsx` — agent run UI + packet
  download (Markdown / plain text / Print-to-PDF).
- `components/grantpilot/grantpilot-console.tsx` — composes the three.

### Try it

1. `pnpm install`
2. `cp .env.example .env.local` and fill the **required** starter vars
   (`AUTH_SECRET`, OAuth provider creds, `DATABASE_URL`, Resend, Stripe).
   GrantPilot itself does not require any additional vars.
3. `pnpm dev`, sign in, then visit `/dashboard/grantpilot`.

### Future hooks (not in this slice)

- Live Grants.gov / SAM.gov fetcher (replace `DEMO_GRANTS` with a server-side
  fetch + cache layer).
- Per-section LLM rewrite (Perplexity Computer / Claude / OpenAI) keyed on
  `lib/grantpilot/packet.ts` section IDs.
- Native PDF export with `@react-pdf/renderer`; Word export with
  `docxtemplater` driven from the same packet sections.
- Persistence of profile + draft state in Postgres (already wired via Prisma
  and the existing `User` model).

## Research Agent

A built-in agentic research console at `/dashboard/research` demonstrates how
to layer an autonomous-agent feature on top of this SaaS starter. The agent
plans sub-questions, runs web searches, reasons over the results, and
synthesizes a cited answer — all streamed back as structured Server-Sent
Events.

The design draws from several public reference projects:

- [`langchain-ai/langchainjs`](https://github.com/langchain-ai/langchainjs) — JS
  agent orchestration patterns (typed step events, tool abstractions).
- [`openai/openai-assistants-quickstart`](https://github.com/openai/openai-assistants-quickstart)
  — Next.js streaming endpoint and assistant-style UI shape.
- [`Significant-Gravitas/AutoGPT`](https://github.com/Significant-Gravitas/AutoGPT)
  — autonomous task-loop with explicit statuses.
- [`microsoft/autogen`](https://github.com/microsoft/autogen) — role-based
  multi-agent breakdown (planner / researcher / writer).
- [`assafelovic/gpt-researcher`](https://github.com/assafelovic/gpt-researcher)
  — planner → retriever → synthesizer pipeline with citations.

### Key files

- `lib/agents/types.ts` — shared event/step types.
- `lib/agents/synthesizer.ts` — provider-neutral local planner + synthesizer.
  Deterministic, no network calls, no paid-LLM dependency.
- `lib/agents/search.ts` — web search wrapper (Tavily, with demo fallback).
- `lib/agents/research.ts` — orchestrator that yields `AgentEvent`s.
- `app/api/research/route.ts` — authenticated SSE endpoint.
- `app/(protected)/dashboard/research/page.tsx` — dashboard page.
- `components/research/research-console.tsx` — chat-style UI with live step
  list, sources, and final cited answer.

### Configuration

The agent is fully functional with zero configuration. The only optional
variable enables live web search via Tavily; everything else is local.

| Var | Purpose |
| --- | ------- |
| `TAVILY_API_KEY` | Enables live web search (otherwise demo source links). Server-side only. |

> The planner and answer synthesizer are deterministic local code. No OpenAI
> or other paid-LLM credentials are read by the agent.

### Try it

1. `pnpm install`
2. `cp .env.example .env.local` and fill the required starter vars.
3. `pnpm dev` and sign in, then visit `/dashboard/research`.
4. (Optional) Add `TAVILY_API_KEY` to your `.env.local` for live web search.

## Roadmap
- [ ] Upgrade eslint to v9
- [ ] Add resend for success subscriptions

## Tech Stack + Features

https://github.com/mickasmt/next-saas-stripe-starter/assets/62285783/828a4e0f-30e3-4cfe-96ff-4dfd9cd55124

### Frameworks

- [Next.js](https://nextjs.org/) – React framework for building performant apps with the best developer experience
- [Auth.js](https://authjs.dev/) – Handle user authentication with ease with providers like Google, Twitter, GitHub, etc.
- [Prisma](https://www.prisma.io/) – Typescript-first ORM for Node.js
- [React Email](https://react.email/) – Versatile email framework for efficient and flexible email development

### Platforms

- [Vercel](https://vercel.com/) – Easily preview & deploy changes with git
- [Resend](https://resend.com/) – A powerful email framework for streamlined email development
- [Neon](https://neon.tech/) – Serverless Postgres with autoscaling, branching, bottomless storage and generous free tier.

### UI

- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework for rapid UI development
- [Shadcn/ui](https://ui.shadcn.com/) – Re-usable components built using Radix UI and Tailwind CSS
- [Framer Motion](https://framer.com/motion) – Motion library for React to animate components with ease
- [Lucide](https://lucide.dev/) – Beautifully simple, pixel-perfect icons
- [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) – Optimize custom fonts and remove external network requests for improved performance
- [`ImageResponse`](https://nextjs.org/docs/app/api-reference/functions/image-response) – Generate dynamic Open Graph images at the edge

### Hooks and Utilities

- `useIntersectionObserver` – React hook to observe when an element enters or leaves the viewport
- `useLocalStorage` – Persist data in the browser's local storage
- `useScroll` – React hook to observe scroll position ([example](https://github.com/mickasmt/precedent/blob/main/components/layout/navbar.tsx#L12))
- `nFormatter` – Format numbers with suffixes like `1.2k` or `1.2M`
- `capitalize` – Capitalize the first letter of a string
- `truncate` – Truncate a string to a specified length
- [`use-debounce`](https://www.npmjs.com/package/use-debounce) – Debounce a function call / state update

### Code Quality

- [TypeScript](https://www.typescriptlang.org/) – Static type checker for end-to-end typesafety
- [Prettier](https://prettier.io/) – Opinionated code formatter for consistent code style
- [ESLint](https://eslint.org/) – Pluggable linter for Next.js and TypeScript

### Miscellaneous

- [Vercel Analytics](https://vercel.com/analytics) – Track unique visitors, pageviews, and more in a privacy-friendly way

## Author

Created by [@miickasmt](https://twitter.com/miickasmt) in 2023, released under the [MIT license](https://github.com/shadcn/taxonomy/blob/main/LICENSE.md).

## Credits

This project was inspired by shadcn's [Taxonomy](https://github.com/shadcn-ui/taxonomy), Steven Tey’s [Precedent](https://github.com/steven-tey/precedent), and Antonio Erdeljac's [Next 13 AI SaaS](https://github.com/AntonioErdeljac/next13-ai-saas).

- Shadcn ([@shadcn](https://twitter.com/shadcn))
- Steven Tey ([@steventey](https://twitter.com/steventey))
- Antonio Erdeljac ([@YTCodeAntonio](https://twitter.com/AntonioErdeljac))
