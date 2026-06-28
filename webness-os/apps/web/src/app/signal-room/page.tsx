import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { SignalRoomPreview } from "@/components/landing/signal-room-preview";
import { Webness100Scorecard } from "@/components/landing/webness-100-scorecard";
import { signalCards } from "@/data/public-site";

export const metadata = {
  title: "Signal Room by Webness",
  description:
    "Signal Room is the proprietary Webness diagnostic engine that scans business signals, ranks the next move, and tracks execution after the build.",
};

export default function SignalRoomPage() {
  return (
    <>
      <Header />
      <main>
        <section className="section-padding bg-slate-950 pt-32 text-white">
          <div className="container-md grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                Signal Room by Webness
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                The diagnosis layer behind every serious Webness build.
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Signal Room scans what is breaking across the website, app,
                content, conversion path, marketing, automation, and tracking.
                Then Webness turns that priority map into a sprint or retainer.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/apply" className="btn-primary">
                  Apply For Signal Scan
                </Link>
                <Link href="/services" className="btn-secondary">
                  View Services
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900 p-6">
              <h2 className="text-2xl font-black">What it scans</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {signalCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-md border border-white/10 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-black text-white">{card.label}</p>
                      <span className="text-sm font-black text-emerald-300">
                        {card.score}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <SignalRoomPreview />
        <Webness100Scorecard />
      </main>
      <Footer />
    </>
  );
}
