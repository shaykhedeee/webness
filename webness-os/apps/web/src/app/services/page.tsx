import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { SERVICES } from "@/data/services";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-slate-950 pt-32 pb-24 text-white">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute left-1/4 top-12 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="pointer-events-none absolute right-1/4 top-32 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />

          <div className="container-md relative z-10">
            <ScrollReveal>
              <div className="mb-12 max-w-4xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                  Service Lanes
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  Webness service lanes for premium digital systems.
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-300">
                  Paid diagnosis first, then the right build: website, app,
                  portal, marketing system, or ongoing retainer.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 lg:grid-cols-3">
              {SERVICES.map((service, idx) => (
                <ScrollReveal key={service.slug} delay={100 * (idx % 3)}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="group block rounded-xl border border-white/10 bg-slate-900/60 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-emerald-500/5 backdrop-blur-md relative overflow-hidden h-full flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-300">
                        {service.category} / {service.price}
                      </p>
                      <h2 className="mt-4 text-2xl font-black group-hover:text-emerald-300 transition-colors duration-300">
                        {service.title}
                      </h2>
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        {service.summary}
                      </p>
                    </div>
                    <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-black text-slate-100 group-hover:text-emerald-300 transition-colors">
                      View scope and fit <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
