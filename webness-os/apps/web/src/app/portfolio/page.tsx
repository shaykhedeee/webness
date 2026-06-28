import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { CASE_STUDIES, portfolioCategories } from "@/data/case-studies";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export default function PortfolioPage() {
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
                  Portfolio Proof
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  Work that proves Webness can build across real business categories.
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-300">
                  Live links, Dribbble proof, scope notes, and category patterns
                  for websites, apps, ecommerce, healthcare, SaaS, and premium
                  service businesses.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="mb-12 flex flex-wrap gap-3">
                {portfolioCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-md border border-white/10 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 hover:border-emerald-500 hover:text-white transition-all cursor-default"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-2">
              {CASE_STUDIES.map((study, idx) => (
                <ScrollReveal key={study.slug} delay={100 * (idx % 2)}>
                  <article
                    className="group overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-sm hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 h-full flex flex-col justify-between"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-800">
                      <img
                        src={study.imageUrl}
                        alt={`${study.client} website preview`}
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-7 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                          {study.category}
                        </p>
                        <h2 className="mt-3 text-2xl font-black text-white group-hover:text-emerald-300 transition-colors duration-300">
                          {study.title}
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                          {study.summary}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          href={`/portfolio/${study.slug}`}
                          className="btn-primary px-4 py-2.5 text-xs shadow-lg shadow-emerald-400/5 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Read case study
                        </Link>
                        {study.liveUrl && (
                          <a
                            href={study.liveUrl}
                            className="btn-secondary px-4 py-2.5 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            Live site
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
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
