import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const retainers = [
  {
    name: "Growth System Retainer",
    price: "From Rs. 25,000/mo",
    description:
      "Monthly website, SEO, content, and lead-flow operations for one focused service-business market.",
    scope: [
      "Monthly website health report",
      "Content briefs or posts",
      "Technical and conversion fixes",
      "Lead-flow improvements",
      "Portal updates as the workflow matures",
      "Minimum 3-month commitment",
    ],
    featured: true,
  },
  {
    name: "Premium Systems Retainer",
    price: "From Rs. 75,000/mo",
    description:
      "A higher-touch founder-led partnership for businesses that need product, website, marketing, and operational systems improved together.",
    scope: [
      "Signal Room operating board",
      "Website and app improvement backlog",
      "Marketing and conversion experiments",
      "Monthly strategy and implementation priorities",
      "Approval and reporting discipline",
    ],
    featured: false,
  },
];

export default function RetainersPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] pt-32 pb-24 text-white">
          <div className="container-md relative z-10">
            <ScrollReveal>
              <div className="mb-12 max-w-4xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                  Retainer Programs
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Retainers after Signal Room proves the work.
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-300">
                  Webness should not sell blind monthly retainers. Start with
                  Signal Scan diagnosis, agree on the first priority, then move
                  into ongoing execution only when the work is clear.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 lg:grid-cols-2">
              {retainers.map((offer, idx) => (
                <ScrollReveal key={offer.name} delay={100 * (idx + 1)} className="h-full">
                  <article
                    className={`rounded-xl border p-8 flex flex-col justify-between h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${
                      offer.featured
                        ? "border-emerald-300/60 bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-400/10"
                        : "border-white/10 bg-slate-900/60 text-white backdrop-blur-md"
                    }`}
                  >
                    <div>
                      <h2 className="text-3xl font-black">{offer.name}</h2>
                      <p
                        className={`mt-4 text-4xl font-black font-mono ${
                          offer.featured ? "text-slate-950" : "text-amber-200"
                        }`}
                      >
                        {offer.price}
                      </p>
                      <p
                        className={`mt-5 text-sm leading-6 ${
                          offer.featured ? "text-emerald-950 font-medium" : "text-slate-300"
                        }`}
                      >
                        {offer.description}
                      </p>
                      <ul
                        className={`mt-8 space-y-3 text-sm leading-6 ${
                          offer.featured ? "text-emerald-950" : "text-slate-300"
                        }`}
                      >
                        {offer.scope.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className={offer.featured ? "text-slate-950 font-bold" : "text-emerald-300"}>✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={150}>
              <div className="mt-12 rounded-xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-md">
                <h2 className="text-2xl font-black text-white">Operating rhythm</h2>
                <div className="mt-7 grid gap-6 md:grid-cols-4">
                  {[
                    ["Week 1", "Audit result becomes a scoped sprint board."],
                    ["Week 2", "Ship technical, CTA, tracking, and proof fixes."],
                    ["Week 3", "Publish content and improve lead capture."],
                    ["Week 4", "Send report, review next actions, repeat."],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-lg bg-slate-950/80 border border-white/5 p-5">
                      <h3 className="font-black text-emerald-300">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-12 rounded-xl border border-white/10 bg-slate-900/60 p-8 text-white backdrop-blur-md hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
                <h2 className="text-2xl font-black text-white">Start with Signal Scan.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 font-medium">
                  If the first priority is not clear, do not buy a retainer. Use
                  the paid diagnostic path first, then decide whether a build
                  sprint or monthly growth system is justified.
                </p>
                <Link
                  href="/apply"
                  className="btn-primary mt-7 shadow-lg shadow-emerald-400/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
