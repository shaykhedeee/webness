import { webness100Checks } from "@/data/public-site";

export function Webness100Scorecard() {
  return (
    <section className="section-padding bg-slate-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-1/3 bottom-12 h-80 w-80 rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="container-md grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start relative z-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300 bg-amber-500/5 border border-amber-500/10 rounded-full px-3.5 py-1.5 inline-block">
            Webness 100 standard
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Nothing should perform below the internal quality bar.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            The standard keeps the public site and every offer honest: proof,
            performance, clear CTAs, mobile polish, and margin discipline.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {webness100Checks.map((check) => (
            <div key={check} className="rounded-xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300">
              <p className="text-sm leading-6 text-slate-300">{check}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

