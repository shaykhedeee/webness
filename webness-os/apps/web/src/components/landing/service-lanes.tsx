import Link from "next/link";
import { buildLanes } from "@/data/public-site";
import { SERVICES } from "@/data/services";
import { ScrollReveal } from "./scroll-reveal";

export function ServiceLanes() {
  return (
    <section id="services" className="section-padding bg-slate-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />

      <div className="container-md relative z-10">
        <ScrollReveal>
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300 bg-amber-500/5 border border-amber-500/10 rounded-full px-3.5 py-1.5 inline-block">
              What Webness builds
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Digital systems, not one-off pages.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Webness can still close website and app work, but the offer is framed
              as performance infrastructure: website, app, marketing, tracking,
              and operating rhythm.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buildLanes.map((lane, idx) => (
            <ScrollReveal key={lane.title} delay={100 * (idx % 3)} className="h-full">
              <article className="rounded-xl border border-white/5 bg-slate-900/40 p-6 hover:border-emerald-500/20 hover:bg-slate-900/60 transition-all duration-300 h-full shadow-sm hover:shadow-md backdrop-blur-md">
                <h3 className="text-xl font-black text-white">{lane.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{lane.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {SERVICES.slice(0, 3).map((service, idx) => (
            <ScrollReveal key={service.slug} delay={150 * (idx + 1)}>
              <Link
                href={`/services/${service.slug}`}
                className="group block rounded-xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 h-full flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                    {service.price}
                  </p>
                  <h3 className="mt-3 text-2xl font-black text-white group-hover:text-emerald-300 transition-colors duration-300">{service.shortTitle}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{service.summary}</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-black text-emerald-300 group-hover:text-emerald-200 transition-colors">
                  View scope <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

