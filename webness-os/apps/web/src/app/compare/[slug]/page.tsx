import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { COMPARISONS, getComparison } from "@/data/comparisons";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return COMPARISONS.map((comparison) => ({ slug: comparison.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) return {};

  return {
    title: `${comparison.title} - Webness`,
    description: comparison.summary,
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getComparison(slug);

  if (!comparison) {
    notFound();
  }
  const selectedComparison = comparison as NonNullable<typeof comparison>;

  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] pt-32 pb-24 text-white">
          <div className="container-md relative z-10">
            <ScrollReveal delay={0}>
              <div className="max-w-4xl">
                <Link href="/compare" className="text-sm font-bold text-emerald-300 hover:text-emerald-200 transition-colors">
                  ← Back to comparisons
                </Link>
                <h1 className="mt-8 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  {selectedComparison.title}
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-300">
                  {selectedComparison.summary}
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <ScrollReveal delay={100} className="h-full">
                <section className="rounded-xl border border-white/10 bg-slate-900/40 p-8 h-full backdrop-blur-md">
                  <h2 className="text-2xl font-black text-white">What competitors sell</h2>
                  <p className="mt-5 text-base leading-8 text-slate-400">
                    {selectedComparison.competitorFrame}
                  </p>
                </section>
              </ScrollReveal>

              <ScrollReveal delay={200} className="h-full">
                <section className="rounded-xl border border-emerald-500/20 bg-slate-900/80 p-8 h-full shadow-xl shadow-emerald-500/5 backdrop-blur-md">
                  <h2 className="text-2xl font-black text-emerald-300">What Webness sells</h2>
                  <p className="mt-5 text-base leading-8 text-slate-300">
                    {selectedComparison.webnessFrame}
                  </p>
                </section>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={150}>
              <section className="mt-10 rounded-xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-md">
                <h2 className="text-2xl font-black text-white">Positioning takeaways</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {selectedComparison.takeaways.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-white/5 bg-slate-950/70 p-5 text-sm font-semibold leading-6 text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-10 rounded-xl bg-emerald-400 p-8 text-slate-950 shadow-xl shadow-emerald-400/10">
                <h2 className="text-2xl font-black">{selectedComparison.cta}</h2>
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
