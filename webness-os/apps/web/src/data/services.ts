export interface ServicePage {
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  summary: string;
  problem: string;
  outcome: string;
  promise: string;
  price: string;
  timeline: string;
  bestFor: string[];
  deliverables: string[];
  proofPoints: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const SERVICES: ServicePage[] = [
  {
    slug: "website-brand-system",
    title: "Website / Brand System Sprint",
    shortTitle: "Website Systems",
    category: "Premium Website",
    summary:
      "A premium website and brand system sprint for businesses that need trust, clarity, conversion, and a site that can support serious growth.",
    problem:
      "The current site looks acceptable but does not explain the business clearly, convert the right buyers, or create enough confidence for premium deals.",
    outcome:
      "A sharper website system with stronger positioning, better service flow, clear CTAs, portfolio/proof structure, and measurement-ready launch foundations.",
    promise:
      "Turn a scattered or underperforming website into a premium digital front door that supports sales calls, marketing, and long-term growth.",
    price: "From Rs. 75,000",
    timeline: "2 to 4 weeks",
    bestFor: [
      "Premium local and service businesses ready to stop looking generic",
      "Founders who need a serious public presence before outreach",
      "Brands with proof but weak positioning, structure, or conversion paths",
    ],
    deliverables: [
      "Signal Scan diagnosis and priority map",
      "Homepage and core service-page structure",
      "Visual direction, typography, spacing, and component system",
      "Portfolio/proof section and conversion CTA structure",
      "Analytics, Search Console, and launch-readiness checklist",
      "30-day improvement roadmap after launch",
    ],
    proofPoints: [
      "Built from Webness ecommerce, healthcare, tech, DTC, and SaaS work",
      "Designed around premium trust and lead quality, not template volume",
      "Connects directly into retainer and Signal Room tracking after launch",
    ],
    ctaLabel: "Apply For Signal Scan",
    ctaHref: "/apply",
  },
  {
    slug: "app-dashboard-portal",
    title: "App / Dashboard / Portal Sprint",
    shortTitle: "Apps & Portals",
    category: "Product Build",
    summary:
      "A custom web app, dashboard, client portal, or internal operating layer for teams that need software to manage clients, data, approvals, and workflows.",
    problem:
      "The business has outgrown forms, WhatsApp, spreadsheets, and disconnected tools, but does not need a bloated enterprise platform.",
    outcome:
      "A focused product surface that lets users submit, track, approve, manage, and review the work that matters.",
    promise:
      "Design and build the operational interface your business actually needs, with clear user flows and practical delivery boundaries.",
    price: "From Rs. 2.5L",
    timeline: "4 to 8 weeks",
    bestFor: [
      "Founders building MVPs, dashboards, portals, or SaaS tools",
      "Agencies that need client-facing progress and approval systems",
      "Businesses that need a custom workflow but not a full enterprise rebuild",
    ],
    deliverables: [
      "Product scope and user-flow map",
      "Dashboard or portal interface",
      "Role-aware screens and core state flows",
      "Data model and integration plan",
      "Launch-ready frontend with handoff documentation",
      "Signal Room tracking plan for ongoing iteration",
    ],
    proofPoints: [
      "Backed by existing Webness dashboard, Resurgo, and portal-style product work",
      "Prioritizes narrow workflows over giant unfinished platforms",
      "Designed for extension into retainers, reporting, and automation",
    ],
    ctaLabel: "Apply For App Diagnosis",
    ctaHref: "/apply",
  },
  {
    slug: "growth-system-retainer",
    title: "Growth System Retainer",
    shortTitle: "Growth Retainers",
    category: "Monthly Growth",
    summary:
      "A monthly improvement system for businesses that want website, SEO, content, conversion, and reporting handled as one operating rhythm.",
    problem:
      "The business launches campaigns or websites, then loses momentum because nobody keeps diagnosing, improving, and proving what changed.",
    outcome:
      "A visible monthly operating cadence with Signal Room scans, priority actions, implemented fixes, and client-ready reporting.",
    promise:
      "Keep the digital system improving after launch instead of letting the website become another static asset.",
    price: "From Rs. 25,000/mo",
    timeline: "Monthly retainer",
    bestFor: [
      "Businesses that already have traffic, offers, or proof but need consistency",
      "Brands that want a practical marketing and website improvement partner",
      "Founders who need diagnostics, implementation, and reporting in one loop",
    ],
    deliverables: [
      "Monthly Signal Room diagnosis",
      "Website and conversion improvements",
      "SEO/content priorities and implementation support",
      "Analytics review and plain-English update",
      "Lead-flow, forms, and automation improvements",
      "Monthly action board and next-step roadmap",
    ],
    proofPoints: [
      "Built around diagnosis -> decision -> execution, not passive dashboards",
      "Creates recurring improvement after websites, portals, and campaigns launch",
      "Uses Signal Room to expose what should be fixed next",
    ],
    ctaLabel: "Apply For Growth Review",
    ctaHref: "/apply",
  },
  {
    slug: "premium-systems-retainer",
    title: "Premium Systems Retainer",
    shortTitle: "Premium Systems",
    category: "High-Touch Partnership",
    summary:
      "A higher-touch partnership for businesses that need ongoing digital product, website, marketing, and operational systems built and improved together.",
    problem:
      "The business has multiple digital problems at once: website, app, marketing, tracking, automation, reporting, and execution are disconnected.",
    outcome:
      "A single Webness-led improvement system that keeps the business moving across product, web, marketing, and operations.",
    promise:
      "Work with Webness as a founder-led systems partner instead of hiring separate vendors for every digital problem.",
    price: "From Rs. 75,000/mo",
    timeline: "3-month minimum",
    bestFor: [
      "Founders with serious growth plans and multiple digital workstreams",
      "Businesses that need a premium build partner plus ongoing execution",
      "Teams that want one operating rhythm for website, app, marketing, and data",
    ],
    deliverables: [
      "Signal Room operating board",
      "Website/app/product improvements",
      "Marketing and conversion experiments",
      "Monthly strategy and implementation priorities",
      "Reporting, approvals, and handoff discipline",
      "Founder-level advisory on digital growth systems",
    ],
    proofPoints: [
      "Positions Webness above low-ticket task execution",
      "Combines portfolio-level craft with recurring diagnostic discipline",
      "Best fit for clients that value quality, speed, and founder attention",
    ],
    ctaLabel: "Apply For Premium Fit",
    ctaHref: "/apply",
  },
  {
    slug: "signal-scan",
    title: "Signal Scan",
    shortTitle: "Signal Scan",
    category: "Paid Diagnosis",
    summary:
      "A paid diagnostic that scans the website, offer, conversion path, marketing signals, automation gaps, and next best move before Webness builds anything.",
    problem:
      "Most businesses buy websites, ads, SEO, or apps before they understand what is actually blocking performance.",
    outcome:
      "A focused priority map that tells you whether the next move should be website, app, marketing, automation, content, or tracking.",
    promise:
      "Before Webness sells you a build, Signal Room identifies the highest-leverage problem worth fixing first.",
    price: "Rs. 9,999 to Rs. 24,999",
    timeline: "3 to 5 business days",
    bestFor: [
      "Businesses unsure whether they need a redesign, app, funnel, or marketing fix",
      "Founders who want a serious diagnosis before committing to a sprint",
      "Premium clients who want strategy backed by evidence, not opinions",
    ],
    deliverables: [
      "Website and positioning review",
      "Conversion and lead-flow review",
      "SEO/search visibility snapshot",
      "Competitor and category notes",
      "Automation and tracking gap list",
      "30-day priority roadmap",
    ],
    proofPoints: [
      "Filters low-ticket work before a build starts",
      "Feeds directly into Webness sprints and retainers",
      "Uses Signal Room as the proprietary diagnostic layer",
    ],
    ctaLabel: "Apply For Signal Scan",
    ctaHref: "/apply",
  },
];

export function getService(slug: string) {
  return SERVICES.find((service) => service.slug === slug);
}
