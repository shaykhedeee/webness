"use client";

import { Header } from "@/components/landing/header";
import { PremiumHero } from "@/components/landing/premium-hero";
import { PortfolioProofGrid } from "@/components/landing/portfolio-proof-grid";
import { ServiceLanes } from "@/components/landing/service-lanes";
import { SignalRoomPreview } from "@/components/landing/signal-room-preview";
import { Webness100Scorecard } from "@/components/landing/webness-100-scorecard";
import { OfferLadder } from "@/components/landing/offer-ladder";
import { ProcessTimeline } from "@/components/landing/process-timeline";
import { FounderProof } from "@/components/landing/founder-proof";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { leadMagnets } from "@/data/public-site";
import { Gift, Download } from "lucide-react";

export default function Home() {
  useScrollReveal();
  return (
    <>
      <Header />
      <PremiumHero />
      <PortfolioProofGrid />
      <ServiceLanes />
      <SignalRoomPreview />
      <Webness100Scorecard />
      <OfferLadder />
      
      {/* Lead Magnet Section */}
      <section className="section-padding bg-slate-950 text-white relative">
        <div className="container-md">
          <div className="max-w-3xl mb-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3.5 py-1.5 inline-block">
              Free Resources
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Steal Our Growth Systems
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Get immediate value before any paid engagement. Each resource helps you understand
              how Webness saves clients thousands monthly through intelligent automation.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {leadMagnets.map((magnet) => (
              <div key={magnet.name} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase text-emerald-300">{magnet.type}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{magnet.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{magnet.body}</p>
                <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition">
                  <Download className="h-4 w-4" />
                  {magnet.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <ProcessTimeline />
      <FounderProof />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
