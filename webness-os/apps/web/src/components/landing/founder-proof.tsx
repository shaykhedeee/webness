import Link from "next/link";
import { acquisitionTargets } from "@/data/public-site";

export function FounderProof() {
  return (
    <section className="section-padding bg-slate-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="container-md grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start relative z-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3.5 py-1.5 inline-block">
            Founder-led trust
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Built from real businesses, not theory.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Webness should sell your judgment, craft, and operating experience.
            Signal Room makes that judgment visible before and after the build.
          </p>
          <Link href="/apply" className="btn-primary mt-8 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Apply For Diagnosis
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-7 backdrop-blur-md">
          <h3 className="text-2xl font-black text-white">Best-fit clients</h3>
          <div className="mt-6 grid gap-3">
            {acquisitionTargets.map((target) => (
              <div key={target} className="rounded-lg border border-white/5 bg-slate-950/60 px-4 py-3 text-sm font-bold text-slate-300">
                {target}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-400">
            The public site should attract serious founders and operators, not
            low-budget requests for isolated pages.
          </p>
        </div>
      </div>
    </section>
  );
}

