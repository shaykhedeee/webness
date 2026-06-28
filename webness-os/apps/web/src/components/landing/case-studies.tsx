import Link from "next/link";
import { CASE_STUDIES } from "@/data/case-studies";

export function CaseStudies() {
  return (
    <section id="case-studies" className="section-padding bg-slate-900">
      <div className="container-md">
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-white sm:text-5xl">
              Portfolio proof converted into case-study proof.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              The first website should prove that Webness already understands
              ecommerce, healthcare, technical companies, and local-service
              conversion paths.
            </p>
          </div>
          <Link href="/portfolio" className="btn-secondary">
            View all work
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {CASE_STUDIES.slice(0, 3).map((study) => (
            <article
              key={study.slug}
              className="overflow-hidden rounded-xl border border-white/10 bg-slate-950"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-800">
                <img
                  src={study.imageUrl}
                  alt={`${study.client} website preview`}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                  {study.category}
                </p>
                <h3 className="mt-3 text-2xl font-black text-white">
                  {study.client}
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  {study.challenge}
                </p>
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-sm font-semibold text-slate-200">
                    Webness role
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {study.webnessRole}
                  </p>
                </div>
                <Link
                  href={`/portfolio/${study.slug}`}
                  className="mt-6 inline-flex text-sm font-bold text-amber-200"
                >
                  Read case study
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
