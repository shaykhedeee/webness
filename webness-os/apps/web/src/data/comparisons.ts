export interface ComparisonPage {
  slug: string;
  title: string;
  summary: string;
  competitorFrame: string;
  webnessFrame: string;
  takeaways: string[];
  cta: string;
}

export const COMPARISONS: ComparisonPage[] = [
  {
    slug: "seo-tools",
    title: "Webness vs SEO tools",
    summary:
      "Semrush, Ahrefs, Surfer, Frase, and similar tools are useful for finding issues. Webness exists to turn those issues into shipped work.",
    competitorFrame:
      "SEO tools sell dashboards, keyword data, content scores, AI visibility checks, and audits. The buyer still has to decide what matters and implement the fixes.",
    webnessFrame:
      "Webness uses audit logic as the start of a managed workflow: roadmap, sprint, fixes, content direction, reporting, and monthly improvement.",
    takeaways: [
      "Use SEO tools for data depth.",
      "Use Webness when a service business needs implementation.",
      "Do not compete as a raw-data SEO suite.",
      "Lead with fixed fixes, proof, and plain-English reporting.",
    ],
    cta: "Apply for diagnosis before buying another dashboard.",
  },
  {
    slug: "traditional-agency",
    title: "Webness vs traditional agencies",
    summary:
      "Traditional agencies sell web design, SEO, or marketing retainers. Webness packages the first move as a measurable audit-to-sprint system.",
    competitorFrame:
      "A traditional agency often starts with a call, vague proposal, and broad monthly scope. Good agencies can execute well, but buyers struggle to compare what happens first.",
    webnessFrame:
      "Webness starts with a scorecard and one priority, then routes the client into a fixed audit, Launch Sprint, Managed Growth retainer, or portal build.",
    takeaways: [
      "Keep the first offer concrete.",
      "Show the process before the sale.",
      "Use portfolio proof by industry.",
      "Avoid vague full-service promises.",
    ],
    cta: "Start with one measurable growth priority.",
  },
  {
    slug: "diy-automation",
    title: "Webness vs DIY automation",
    summary:
      "Zapier, Make, n8n, and workflow builders are powerful. Most SMBs still need someone to design a reliable process and maintain it.",
    competitorFrame:
      "DIY automation tools sell flexibility. That flexibility becomes risk when workflows break quietly, handle sensitive actions, or lack a clear owner.",
    webnessFrame:
      "Webness sells small automation sprints with workflow maps, handoff docs, approval points, and monitoring so the automation supports the business instead of becoming another system to manage.",
    takeaways: [
      "Automate only where it saves time.",
      "Keep risky actions behind approval.",
      "Document ownership and handoff.",
      "Pair automation with lead and website fixes.",
    ],
    cta: "Audit the bottleneck before automating it.",
  },
];

export function getComparison(slug: string) {
  return COMPARISONS.find((comparison) => comparison.slug === slug);
}
