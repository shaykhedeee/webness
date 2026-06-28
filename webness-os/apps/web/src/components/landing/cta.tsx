import Link from "next/link";

export function CTA() {
  return (
    <section className="section-padding bg-emerald-500 text-slate-950">
      <div className="container-md text-center">
        <h2 className="mx-auto max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
          Start with diagnosis. Leave with one clear build or growth move.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-emerald-950">
          The first Webness flow should turn a serious business bottleneck into
          a clear action map, then into a fixed sprint or managed monthly system.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/apply"
            className="rounded-md bg-slate-950 px-8 py-4 text-base font-black text-white transition hover:bg-slate-800"
          >
            Apply For Signal Scan
          </Link>
          <a
            href="mailto:hello@webness.in?subject=Webness strategy call"
            className="rounded-md border border-emerald-950 px-8 py-4 text-base font-black text-emerald-950 transition hover:bg-emerald-400"
          >
            Book Strategy Call
          </a>
        </div>
      </div>
    </section>
  );
}
