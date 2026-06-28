import { processSteps } from "@/data/public-site";
import { ScrollReveal } from "./scroll-reveal";

export function ProcessTimeline() {
  return (
    <section id="process" className="section-padding bg-slate-950 text-white relative">
      <div className="pointer-events-none absolute left-1/3 bottom-12 h-80 w-80 rounded-full bg-emerald-500/5 blur-[100px]" />
      <div className="container-md relative z-10">
        <ScrollReveal>
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3 py-1 inline-block">
              Process
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              One operating rhythm from diagnosis to improvement.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((item, idx) => (
            <ScrollReveal key={item.step} delay={100 * (idx % 3)} className="h-full">
              <article className="rounded-xl border border-white/5 bg-slate-900/40 p-6 h-full transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-900/60 group">
                <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded px-2.5 py-1 inline-block group-hover:text-amber-200 group-hover:border-amber-200/20 transition-all duration-300">
                  STEP {item.step}
                </span>
                <h3 className="mt-5 text-2xl font-black text-white group-hover:text-emerald-300 transition-colors duration-300">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

