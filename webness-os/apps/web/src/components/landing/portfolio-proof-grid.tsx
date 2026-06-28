import Link from "next/link";
import { CASE_STUDIES, portfolioCategories } from "@/data/case-studies";
import { CaseStudyCard } from "./case-study-card";
import { ScrollReveal } from "./scroll-reveal";

export function PortfolioProofGrid() {
  return (
    <section id="work" className="section-padding bg-slate-950 text-white relative overflow-hidden">
      {/* Glow effect */}
      <div className="pointer-events-none absolute right-1/4 top-12 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="container-md relative z-10">
        <ScrollReveal>
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3.5 py-1.5 inline-block">
                Portfolio proof
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Webness already has proof across real business categories.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                The public site should sell from live work, scope decisions, and
                category fit. No inflated claims. No generic agency promises.
              </p>
            </div>
            <Link href="/portfolio" className="btn-secondary px-6 py-3 text-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
              View all work
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="mb-10 flex flex-wrap gap-3">
            {portfolioCategories.map((category) => (
              <span
                key={category}
                className="rounded-lg border border-white/5 bg-slate-900/40 px-4 py-2 text-sm font-bold text-slate-300 hover:border-emerald-500/30 hover:text-white transition-all duration-300 cursor-default"
              >
                {category}
              </span>
            ))}
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CASE_STUDIES.map((study, idx) => (
            <ScrollReveal key={study.slug} delay={100 * (idx + 1)}>
              <CaseStudyCard study={study} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

