import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="section-padding bg-emerald-400 text-slate-950">
      <div className="container-md text-center">
        <h2 className="mx-auto max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
          Start with diagnosis. Build only what the business actually needs.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-emerald-950">
          Apply for a Signal Scan. If Webness is the right fit, the scan turns
          into a website, app, growth system, or retainer plan.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/apply"
            className="rounded-md bg-slate-950 px-8 py-4 text-base font-black text-white transition hover:bg-slate-800"
          >
            Apply For Signal Scan
          </Link>
          <Link
            href="/portfolio"
            className="rounded-md border border-emerald-950 px-8 py-4 text-base font-black text-emerald-950 transition hover:bg-emerald-300"
          >
            View Work
          </Link>
        </div>
      </div>
    </section>
  );
}

