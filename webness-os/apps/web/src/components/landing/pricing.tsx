import Link from "next/link";

const offers = [
  {
    name: "Business Growth Scan",
    price: "Preview",
    description:
      "A fast qualification read for service SMBs that need to know the first revenue fix.",
    scope: [
      "Website URL and business-type capture",
      "Speed, trust, search, conversion, and automation readiness scores",
      "One prioritized next action",
      "Direct handoff into paid audit request",
    ],
    cta: "Apply For Signal Scan",
    href: "/apply",
    featured: false,
  },
  {
    name: "Signal Scan",
    price: "Rs. 9,999-Rs. 24,999",
    description:
      "Manual review plus AI-assisted website, SEO, content, competitor, and conversion teardown.",
    scope: [
      "PDF or report-page handoff",
      "30-day roadmap",
      "Screenshots and competitor notes",
      "Loom-style walkthrough",
      "Applied toward sprint within 14 days",
    ],
    cta: "Request Audit",
    href: "/audit",
    featured: false,
  },
  {
    name: "Launch Sprint",
    price: "Rs. 39,999",
    description:
      "A 2-week implementation sprint for the highest-value website and visibility fixes.",
    scope: [
      "Homepage or service-page improvement",
      "Technical SEO basics",
      "Analytics and Search Console setup guidance",
      "Lead CTA cleanup",
      "First search and content priority map",
    ],
    cta: "Start With Audit",
    href: "/audit",
    featured: true,
  },
  {
    name: "Managed Growth",
    price: "Rs. 24,999/mo",
    description:
      "Monthly website, SEO, content, and lead-flow operations with a minimum 3-month commitment.",
    scope: [
      "Monthly website health report",
      "Content briefs or posts",
      "Technical and conversion fixes",
      "Lead-flow improvements",
      "Client portal updates as the workflow matures",
    ],
    cta: "View Retainers",
    href: "/retainers",
    featured: false,
  },
  {
    name: "AI Ops / Portal Build",
    price: "Rs. 74,999",
    description:
      "A fixed buildout for agencies or larger SMBs that need a visible operating layer.",
    scope: [
      "Client portal workflow",
      "Automation map and intake forms",
      "Reporting dashboard structure",
      "Approval and handoff process",
      "Team documentation",
    ],
    cta: "View Portal Scope",
    href: "/services/client-portal",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="packages" className="section-padding bg-slate-100 text-slate-950">
      <div className="container-md">
        <div className="mb-14 max-w-3xl">
          <h2 className="text-4xl font-black leading-tight sm:text-5xl">
            Fixed packages with clear boundaries.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            The website should sell outcomes first. The internal platform,
            local infrastructure, and API products stay behind the service until
            the managed workflow proves demand.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {offers.map((offer) => (
            <article
              key={offer.name}
              className={`flex flex-col rounded-xl border p-6 ${
                offer.featured
                  ? "border-slate-950 bg-slate-950 text-white shadow-2xl shadow-slate-400/40"
                  : "border-slate-300 bg-white text-slate-950"
              }`}
            >
              <h3 className="text-xl font-black">{offer.name}</h3>
              <p
                className={`mt-4 text-3xl font-black ${
                  offer.featured ? "text-amber-200" : "text-emerald-700"
                }`}
              >
                {offer.price}
              </p>
              <p
                className={`mt-5 min-h-[96px] text-sm leading-6 ${
                  offer.featured ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {offer.description}
              </p>

              <Link
                href={offer.href}
                className={`mt-7 inline-flex justify-center rounded-md px-4 py-3 text-center text-sm font-bold transition ${
                  offer.featured
                    ? "bg-white text-slate-950 hover:bg-amber-100"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                {offer.cta}
              </Link>

              <ul className="mt-7 space-y-3">
                {offer.scope.map((item) => (
                  <li
                    key={item}
                    className={`text-sm leading-6 ${
                      offer.featured ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
