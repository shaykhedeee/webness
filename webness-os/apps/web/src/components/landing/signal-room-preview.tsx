import Link from "next/link";
import { signalCards } from "@/data/public-site";
import { ScrollReveal } from "./scroll-reveal";

export function SignalRoomPreview() {
  return (
    <section id="signal-room" className="section-padding bg-slate-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-1/4 bottom-12 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="container-md relative z-10">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3.5 py-1.5 inline-block">
              Signal Room by Webness
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Before we build, we diagnose.
            </h2>
          </div>
          <p className="text-lg leading-8 text-slate-300">
            Signal Room scans the business surface, ranks the next move, and
            turns findings into a build sprint or retainer plan. It is the
            Webness engine, not a separate brand yet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {signalCards.map((card) => (
            <article key={card.label} className="rounded-xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-black text-white">{card.label}</h3>
                <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-300">
                  {card.score}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-white leading-tight">
              Scan to priority map. <br />
              <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text text-transparent">Sprint to retainer.</span>
            </h3>
            <p className="text-base leading-8 text-slate-400">
              That is the Webness operating rhythm. Signal Room first qualifies the
              actual bottleneck, Webness builds the solution, and then Signal Room
              tracks telemetry trends to suggest the next high-leverage growth move.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Link href="/signal-room" className="btn-primary hover:scale-[1.02] active:scale-[0.98] transition-all px-8 py-4 text-center">
                Explore Signal Room
              </Link>
              <Link href="/apply" className="btn-secondary hover:scale-[1.02] active:scale-[0.98] transition-all px-8 py-4 text-center">
                Request a Scan
              </Link>
            </div>
          </div>
          
          <ScrollReveal delay={200}>
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-2 shadow-2xl shadow-black/85 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-500 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500 pointer-events-none" />
              <img
                src="/images/signal-dashboard.png"
                alt="Signal Room Autopilot Dashboard Preview"
                className="w-full rounded-xl object-cover shadow-inner border border-white/5 relative z-10"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
