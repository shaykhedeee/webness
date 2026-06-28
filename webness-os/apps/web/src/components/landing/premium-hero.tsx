import Link from "next/link";
import { proofMetrics } from "@/data/public-site";
import { ScrollReveal } from "./scroll-reveal";

export function PremiumHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-28 text-white sm:pt-32">
      {/* Blur background blobs */}
      <div className="pointer-events-none animate-float absolute left-1/4 top-12 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="pointer-events-none animate-float-delayed absolute right-1/4 top-32 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="container-md grid min-h-[720px] gap-12 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-20 relative z-10">
        <div className="min-w-0 space-y-6">
          <ScrollReveal delay={0}>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3.5 py-1.5 inline-block">
              Founder-led digital systems studio
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={150}>
            <h1 className="max-w-5xl text-4xl font-black leading-[1.04] text-white sm:text-6xl lg:text-7xl">
              Websites, apps, and <span className="gradient-text">growth systems</span> built to perform.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Webness builds premium digital infrastructure and uses Signal Room to
              diagnose, prioritize, and track what your business needs next. We do not build on assumptions.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={450}>
            <div className="flex flex-col gap-4 sm:flex-row pt-2">
              <Link href="/apply" className="btn-primary">
                Apply For Signal Scan
              </Link>
              <Link href="/portfolio" className="btn-secondary">
                View Work
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={600}>
            <div className="mt-8 grid gap-4 border-t border-white/5 pt-8 sm:grid-cols-3">
              {proofMetrics.map((metric) => (
                <div key={metric.label} className="group">
                  <p className="text-3xl font-black text-emerald-300 group-hover:text-amber-200 transition-colors duration-300">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {metric.note}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={400} className="min-w-0">
          <div className="glass-card group">
            <div className="border-b border-white/10 pb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Signal Room priority map
              </p>
              <h2 className="mt-2 text-2xl font-black text-white group-hover:text-emerald-300 transition-colors duration-300">
                Diagnose before build.
              </h2>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ["Website", "Trust and conversion path need the first fix.", "84", "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"],
                ["App / Portal", "Operational workflow is ready for a focused dashboard.", "71", "border-amber-500/20 bg-amber-500/5 text-amber-300"],
                ["Growth System", "Retainer fit depends on tracking cleanup first.", "62", "border-amber-500/20 bg-amber-500/5 text-amber-300"],
              ].map(([label, body, score, badgeStyle]) => (
                <div key={label} className="rounded-xl border border-white/5 bg-slate-950/70 p-4 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                    </div>
                    <span className={`rounded-lg border px-3 py-1 text-sm font-black ${badgeStyle}`}>
                      {score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">
              <p className="text-sm font-black text-emerald-300">Next move</p>
              <p className="mt-2 text-sm leading-6">
                Paid Signal Scan, then a focused build sprint only if the evidence
                supports it.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

