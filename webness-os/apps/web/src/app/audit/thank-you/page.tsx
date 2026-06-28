"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { Brain, ArrowRight, ShieldCheck, Zap, Sparkles, BarChart2, Cpu } from "lucide-react";

interface AuditResult {
  score: number;
  speed: number;
  trust: number;
  search: number;
  conversion: number;
  automation: number;
  summary: string;
  websiteUrl: string;
  businessType: string;
}

function ReportView() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("lead");
  
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) {
      setLoading(false);
      return;
    }

    fetch(`/api/audit-leads?id=${leadId}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload.ok && payload.data) {
          setLead(payload.data);
        }
      })
      .catch((err) => console.error("Error fetching lead:", err))
      .finally(() => setLoading(false));
  }, [leadId]);

  function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
    return (
      <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 hover:border-emerald-500/20 transition-all group">
        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
          <span className="font-bold text-slate-200 flex items-center gap-2">
            <Icon className="h-4 w-4 text-emerald-400 group-hover:animate-pulse" /> {label}
          </span>
          <span className="font-bold text-emerald-300">{value}/100</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const result = lead?.result as AuditResult;

  return (
    <>
      {result ? (
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#021412_0%,#090d16_50%,#020617_100%)] pt-36 pb-24 text-white">
          <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px]" />

          <div className="container-md relative z-10">
            <ScrollReveal>
              <div className="max-w-4xl mb-12">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3.5 py-1.5 inline-block mb-4">
                  Signal Scan Report
                </p>
                <h1 className="text-4xl font-black leading-[1.05] sm:text-6xl">
                  Growth Snapshot for <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text text-transparent">{result.websiteUrl}</span>
                </h1>
                <p className="mt-4 text-slate-400 text-sm">
                  Generated on {new Date(lead.createdAt).toLocaleDateString()} · ID: {leadId}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] items-start">
              <ScrollReveal delay={100}>
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-md shadow-2xl flex flex-col items-center text-center">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 mb-6">Composite Digital Health</p>
                  
                  <div className="relative flex items-center justify-center h-48 w-48 rounded-full border-4 border-slate-800 bg-slate-950/60 shadow-inner group">
                    <div className="absolute inset-2 rounded-full border border-dashed border-emerald-500/20 group-hover:scale-105 transition-transform" />
                    <div className="text-center">
                      <span className="text-6xl font-black text-white">{result.score}</span>
                      <span className="text-sm font-bold text-slate-500 block mt-1">/100</span>
                    </div>
                  </div>

                  <div className="mt-8 rounded-xl bg-slate-950/80 border border-emerald-500/20 p-5 text-left w-full">
                    <h3 className="font-black text-emerald-300 flex items-center gap-2">
                      <Brain className="h-4 w-4" /> Priority Bottleneck
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {result.summary}
                    </p>
                  </div>

                  <div className="mt-6 w-full border border-white/5 bg-slate-900/60 hover:border-emerald-400/20 rounded-xl p-5 text-left transition-all duration-300">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-300" /> Webness Autopilot Agency OS
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Your diagnostic profile has been synced. You can now unlock the Webness Autopilot Dashboard to request automated fixes, copywriter repurposing, and full sprint execution.
                    </p>
                    <a
                      href="http://localhost:3000"
                      className="btn-primary mt-4 w-full py-2.5 text-sm flex items-center justify-center gap-2 group shadow-md shadow-emerald-400/10"
                    >
                      Enter OS Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200} className="space-y-4">
                <h3 className="text-xl font-black text-white pl-1 mb-2">Growth Signals Breakdown</h3>
                <ScoreBar label="Speed & core web vitals" value={result.speed} icon={Zap} />
                <ScoreBar label="Trust markers & proof layout" value={result.trust} icon={ShieldCheck} />
                <ScoreBar label="Search & AI engine indexability" value={result.search} icon={BarChart2} />
                <ScoreBar label="Conversion path clarity" value={result.conversion} icon={Sparkles} />
                <ScoreBar label="Workflow automation readiness" value={result.automation} icon={Cpu} />
                
                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <Link href="/services" className="btn-secondary flex-1 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Explore Sprints & Sells
                  </Link>
                  <a href="mailto:hello@webness.in" className="btn-secondary flex-1 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Consult with Lead Architect
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#031a18_0%,#0f172a_62%,#111827_100%)] pt-36 pb-24 text-white">
          <div className="container-md relative z-10">
            <ScrollReveal>
              <div className="max-w-4xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                  Signal Scan request received
                </p>
                <h1 className="mt-5 text-5xl font-black leading-tight sm:text-6xl">
                  The next step is a focused fit review.
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                  Your application has been received and synchronized with our team. We will analyze your website signals, configure a 30-day action map, and contact you via email or WhatsApp to recommend the next leverage point.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {[
                {
                  label: "1",
                  title: "Review the website and market",
                  body: "Confirm the business category, target location, current tools, and the biggest lead bottleneck.",
                },
                {
                  label: "2",
                  title: "Prepare the Signal Scan scope",
                  body: "Package the manual teardown, Signal Room notes, competitor signals, and 30-day action map.",
                },
                {
                  label: "3",
                  title: "Route into the right offer",
                  body: "Recommend website sprint, app/portal sprint, growth retainer, or premium systems support only after the diagnosis proves the priority.",
                },
              ].map((step, idx) => (
                <ScrollReveal key={step.title} delay={100 * (idx + 1)} className="h-full">
                  <article
                    className="rounded-xl border border-white/10 bg-slate-900/50 p-6 h-full transition-all duration-300 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400 font-black text-slate-950 font-mono">
                        {step.label}
                      </div>
                      <h2 className="mt-5 text-xl font-black">{step.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {step.body}
                      </p>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={250}>
              <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                <a href="mailto:hello@webness.in" className="btn-primary shadow-lg shadow-emerald-400/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Email Webness
                </a>
                <Link href="/portfolio" className="btn-secondary hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Review Portfolio Proof
                </Link>
                <Link href="/services" className="btn-secondary hover:scale-[1.02] active:scale-[0.98] transition-all">
                  See Service Options
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}
    </>
  );
}

export default function AuditThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      }>
        <ReportView />
      </Suspense>
      <Footer />
    </main>
  );
}
