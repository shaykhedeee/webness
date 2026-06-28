import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { CASE_STUDIES, getCaseStudy } from "@/data/case-studies";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};

  return {
    title: `${study.client} case study - Webness`,
    description: study.summary,
  };
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  if (!study) {
    notFound();
  }
  const selectedStudy = study as NonNullable<typeof study>;

  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] pt-32 pb-24 text-white">
          <div className="container-md relative z-10">
            <Link href="/portfolio" className="text-sm font-bold text-emerald-300 hover:text-emerald-200 transition-colors">
              ← Back to portfolio
            </Link>

            <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <ScrollReveal delay={0}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-300">
                    {selectedStudy.category}
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                    {selectedStudy.title}
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-slate-300">
                    {selectedStudy.summary}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {selectedStudy.liveUrl && (
                      <a
                        href={selectedStudy.liveUrl}
                        className="btn-primary px-5 py-3 text-sm shadow-lg shadow-emerald-400/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Visit live site
                      </a>
                    )}
                    <a
                      href={selectedStudy.dribbbleUrl}
                      className="btn-secondary px-5 py-3 text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      View Dribbble proof
                    </a>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-1 shadow-2xl shadow-black/50 backdrop-blur-md">
                  <img
                    src={selectedStudy.imageUrl}
                    alt={`${selectedStudy.client} website preview`}
                    className="h-full w-full rounded-lg object-cover object-top"
                  />
                </div>
              </ScrollReveal>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              <ScrollReveal delay={100} className="h-full">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Client context</h2>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {selectedStudy.challenge}
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={200} className="h-full">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Webness role</h2>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {selectedStudy.webnessRole}
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={300} className="h-full">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-xl font-black text-white">Proof assets</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    {selectedStudy.proof.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-300 shrink-0 select-none">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              <ScrollReveal delay={100} className="h-full">
                <section className="rounded-xl border border-white/10 bg-slate-900/50 p-7 h-full">
                  <h2 className="text-2xl font-black text-white">Scope</h2>
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                    {selectedStudy.scope.map((item) => (
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
                  <h2 className="text-2xl font-black text-white">Design and growth decisions</h2>
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                    {selectedStudy.decisions.map((item) => (
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
              <div className="mt-12 rounded-xl bg-emerald-400 p-8 text-slate-950 shadow-xl shadow-emerald-400/10">
                <h2 className="text-2xl font-black">
                  Turn this proof into your own digital system.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-950 font-medium">
                  Start with a Signal Scan. Webness will identify whether the
                  next best move is website, app, marketing system, automation, or
                  retainer support.
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
