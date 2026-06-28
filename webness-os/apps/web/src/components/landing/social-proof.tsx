import Link from "next/link";
import { CASE_STUDIES, portfolioCategories } from "@/data/case-studies";

export function SocialProof() {
  return (
    <section id="proof" className="section-padding bg-slate-100 text-slate-950">
      <div className="container-md">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Proof, not promises.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-700">
              Dribbble is useful as proof inventory, but Webness should sell from
              stronger assets: live links, project scope, screenshots, delivery
              notes, and a clear process that turns design work into business
              growth work.
            </p>
            <Link href="/portfolio" className="mt-8 inline-flex font-bold text-emerald-700">
              Explore the portfolio
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Live links", "Giftyaari, Arog Bharat, and Pixella are public proof surfaces."],
              ["Project scope", "UI/UX, WordPress, React, SEO foundations, and maintenance."],
              ["Service fit", "Service SMBs can see work in their own category before buying."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-slate-300 bg-white p-5">
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioCategories.map((category) => (
            <div
              key={category}
              className="rounded-lg border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-800"
            >
              {category}
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {CASE_STUDIES.map((study) => (
            <Link
              key={study.slug}
              href={`/portfolio/${study.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-200">
                <img
                  src={study.imageUrl}
                  alt={`${study.client} website project`}
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {study.category}
                </p>
                <h3 className="mt-2 text-lg font-black text-slate-950">
                  {study.client}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {study.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
