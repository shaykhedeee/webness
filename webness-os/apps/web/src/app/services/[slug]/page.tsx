import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { getService, SERVICES } from "@/data/services";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return {
    title: `${service.title} - Webness`,
    description: service.summary,
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    notFound();
  }
  const selectedService = service as NonNullable<typeof service>;

  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] pt-32 pb-24 text-white">
          <div className="container-md relative z-10">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <ScrollReveal delay={0}>
                <div>
                  <Link href="/#services" className="text-sm font-bold text-emerald-300 hover:text-emerald-200 transition-colors">
                    ← Back to services
                  </Link>
                  <h1 className="mt-8 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                    {selectedService.title}
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-slate-300">
                    {selectedService.summary}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4 font-mono">
                    <span className="rounded-md bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950">
                      {selectedService.price}
                    </span>
                    <span className="rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white">
                      {selectedService.timeline}
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-md">
                  <h2 className="text-2xl font-black text-white">Promise</h2>
                  <p className="mt-4 text-base leading-7 text-slate-300">
                    {selectedService.promise}
                  </p>
                  <Link href={selectedService.ctaHref} className="btn-primary mt-7 shadow-lg shadow-emerald-400/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {selectedService.ctaLabel}
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              <ScrollReveal delay={100} className="h-full">
                <section className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Problem</h2>
                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    {selectedService.problem}
                  </p>
                </section>
              </ScrollReveal>

              <ScrollReveal delay={200} className="h-full">
                <section className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Outcome</h2>
                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    {selectedService.outcome}
                  </p>
                </section>
              </ScrollReveal>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <ScrollReveal delay={100} className="h-full">
                <section className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Best for</h2>
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                    {selectedService.bestFor.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-300 shrink-0 select-none">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>

              <ScrollReveal delay={200} className="h-full">
                <section className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Deliverables</h2>
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                    {selectedService.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-300 shrink-0 select-none">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>

              <ScrollReveal delay={300} className="h-full">
                <section className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Why this wins</h2>
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                    {selectedService.proofPoints.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-300 shrink-0 select-none">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={150}>
              <div className="mt-14 rounded-xl bg-emerald-400 p-8 text-slate-950 shadow-xl shadow-emerald-400/10">
                <h2 className="text-2xl font-black">
                  Not sure if this is the right Webness scope?
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-950 font-medium">
                  Start with a paid Signal Scan. The diagnosis should decide
                  whether this needs a website sprint, app build, marketing
                  system, automation cleanup, or retainer.
                </p>
                <Link
                  href="/apply"
                  className="mt-7 inline-flex rounded-md bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 transition-colors shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Apply For Signal Scan
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
