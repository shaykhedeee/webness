import Link from "next/link";
import { SERVICES } from "@/data/services";

const process = [
  {
    step: "01",
    title: "Audit",
    body: "Score the site across speed, trust, search, conversion, and automation readiness.",
  },
  {
    step: "02",
    title: "Roadmap",
    body: "Turn the audit into one prioritized 30-day action plan instead of a giant checklist.",
  },
  {
    step: "03",
    title: "Build Sprint",
    body: "Fix the highest-leverage website, SEO, tracking, and lead-flow issues.",
  },
  {
    step: "04",
    title: "Portal Tracking",
    body: "Use a visible client workflow for milestones, files, approvals, reports, and next actions.",
  },
  {
    step: "05",
    title: "Monthly Growth",
    body: "Keep improving the site through content, technical fixes, reporting, and automation.",
  },
];

export function Features() {
  return (
    <section id="process" className="section-padding bg-slate-950">
      <div className="container-md">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Tools show issues. Webness fixes and monitors them.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Semrush, Ahrefs, Surfer, Frase, and dashboards are useful, but
              service SMBs still need someone to turn findings into shipped work.
              Webness sells the implementation layer.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {process.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
              >
                <span className="text-sm font-black text-amber-200">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="services" className="mt-20">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Three service lanes behind the Managed Growth offer
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Each lane is packaged as implementation, not abstract consulting.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group rounded-xl border border-white/10 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-emerald-300/50"
              >
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">
                  {service.price}
                </p>
                <h3 className="mt-4 text-2xl font-black text-white">
                  {service.shortTitle}
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  {service.summary}
                </p>
                <span className="mt-7 inline-flex text-sm font-bold text-amber-200">
                  View scope
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
