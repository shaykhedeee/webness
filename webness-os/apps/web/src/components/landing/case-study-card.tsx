import Link from "next/link";
import type { CaseStudy } from "@/data/case-studies";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 h-full flex flex-col justify-between">
      <div>
        <div className="aspect-[16/10] overflow-hidden bg-slate-800">
          <img
            src={study.imageUrl}
            alt={`${study.client} project preview`}
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            {study.category}
          </p>
          <h3 className="mt-3 text-xl font-black text-white">{study.client}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{study.summary}</p>
        </div>
      </div>
      <div className="p-6 pt-0">
        <Link
          href={`/portfolio/${study.slug}`}
          className="inline-flex text-sm font-black text-emerald-300 hover:text-emerald-200 transition-colors"
        >
          Read case study <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </article>
  );
}

