import Link from "next/link";
import { offerLadder } from "@/data/public-site";
import { ScrollReveal } from "./scroll-reveal";

export function OfferLadder() {
  return (
    <section id="pricing" className="section-padding bg-slate-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 bottom-12 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="container-md relative z-10">
        <ScrollReveal>
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3.5 py-1.5 inline-block">
              Offer ladder
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Accessible premium, with a paid diagnosis gate.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Webness does not chase low-ticket task work. The path starts with a
              Signal Scan, then moves into focused builds or retainers.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 lg:grid-cols-5">
          {offerLadder.map((offer, index) => (
            <ScrollReveal key={offer.name} delay={100 * (index + 1)} className="h-full">
              <article
                className={`flex min-h-[320px] flex-col rounded-xl border p-5 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md ${
                  index === 0
                    ? "border-emerald-500/30 bg-slate-900/80 text-white hover:border-emerald-500 hover:shadow-emerald-500/10"
                    : "border-white/5 bg-slate-900/40 text-white hover:border-white/20"
                }`}
              >
                <p className={`text-xs font-black uppercase tracking-[0.16em] ${index === 0 ? "text-emerald-300" : "text-emerald-400"}`}>
                  {offer.price}
                </p>
                <h3 className="mt-4 text-xl font-black text-white">{offer.name}</h3>
                <p className={`mt-4 text-sm leading-6 ${index === 0 ? "text-slate-300" : "text-slate-400"}`}>
                  {offer.body}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <ScrollReveal delay={300}>
            <Link href="/apply" className="btn-primary hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex px-8 py-4">
              Apply For Signal Scan
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={350}>
            <Link href="/early-access" className="btn-secondary hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex px-8 py-4">
              Enter Early Access Portal
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

