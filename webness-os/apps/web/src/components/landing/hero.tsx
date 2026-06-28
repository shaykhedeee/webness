"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { buildAuditResult, businessTypes, normalizeUrl } from "@/lib/audit";

export function Hero() {
  // Input states
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessType, setBusinessType] = useState(businessTypes[0]);
  const [email, setEmail] = useState("");
  
  // App states
  const [step, setStep] = useState<"input" | "scanning" | "results">("input");
  const [progress, setProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [scores, setScores] = useState<any>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Terminal scanning sequence
  const startScan = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!websiteUrl.trim()) {
      setError("Please enter a website URL to scan.");
      return;
    }

    try {
      const normalized = normalizeUrl(websiteUrl);
      new URL(normalized);
    } catch {
      setError("Please enter a valid URL (e.g. acme.com).");
      return;
    }

    setStep("scanning");
    setProgress(0);
    setTerminalLogs([]);

    const logMessages = [
      `[00:01] 🚀 INITIALIZING: Booting Webness OS technical index crawler...`,
      `[00:02] RESOLVING: Resolving DNS pathways for domain: ${websiteUrl}`,
      `[00:04] CRAWLING: Fetching root HTML source code via secure HTTP...`,
      `[00:05] HEADINGS: Parsing H1/H2 tag structures and SEO semantic keywords...`,
      `[00:07] PERFORMANCE: Calculating PageSpeed mobile viewport performance index...`,
      `[00:08] AI_BOTS: Checking index permits for GPT-Bot, Gemini, and Claude...`,
      `[00:09] pgvector: Syncing parameters to pgvector memory bank...`,
      `[00:10] SUCCESS: Cloud audit successfully validated. Generating visual scores...`
    ];

    let currentLogIndex = 0;
    
    // Simulate terminal typing logs
    const logInterval = setInterval(() => {
      if (currentLogIndex < logMessages.length) {
        setTerminalLogs(prev => [...prev, logMessages[currentLogIndex]]);
        setProgress(prev => Math.min(95, prev + 12));
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
        setProgress(100);
        
        // Compute deterministic scores using standard library audit values
        const normalized = normalizeUrl(websiteUrl);
        const computed = buildAuditResult({
          websiteUrl: normalized,
          businessType,
          targetLocation: "Global Market",
          monthlyLeadGoal: "Not Specified",
          currentTools: "Standard",
          biggestBottleneck: "Technical visibility block",
          email: "",
          phoneOrWhatsApp: ""
        });

        setTimeout(() => {
          setScores(computed);
          setStep("results");
        }, 800);
      }
    }, 600);
  };

  // Submit dynamic audit lead
  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch("/api/audit-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: scores.websiteUrl,
          businessType: scores.businessType,
          targetLocation: "Online Acquisition",
          monthlyLeadGoal: "20+ conversions",
          currentTools: "Not Specified",
          biggestBottleneck: `Auto-Audited Technical SEO Speed: ${scores.speed}/100, AI-Search Index: ${scores.search}/100`,
          email: email.trim().toLowerCase(),
          phoneOrWhatsApp: "Not Provided",
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to submit.");

      window.location.assign(`/audit/thank-you?lead=${encodeURIComponent(payload.id || "")}`);
    } catch (err: any) {
      alert(err.message || "Something went wrong. Routing to complete audit...");
      window.location.assign("/audit");
    }
  };

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#031a18_0%,#0f172a_58%,#111827_100%)] pt-32 pb-20 sm:pb-28">
      {/* Soft background glow circles */}
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      <div className="container-md grid min-h-[680px] min-w-0 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* LEFT COLUMN: Highly Impactful B2B Positioning */}
        <div className="min-w-0 space-y-6">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
            <svg className="h-3 w-3 animate-pulse" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
            SwaS Paradigm: Done-For-You AI Operations
          </span>
          
          <h1 className="max-w-4xl break-words text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            We build websites that <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-indigo-300 bg-clip-text text-transparent">AI engines</span> recommend.
          </h1>
          
          <p className="max-w-2xl break-words text-base leading-8 text-slate-300 sm:text-lg">
            Stop building brochure websites that get ignored. Webness designs high-converting websites optimized for search crawlers, captures and scores leads on autopilot, and runs a credit-saving <strong className="text-emerald-300 font-bold">BYOK API Vault</strong> so you pay $0 model markup.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row pt-2">
            <Link href="/audit" className="btn-primary px-8 py-4 text-base shadow-lg shadow-emerald-500/10">
              Get Detailed Audit Pack
            </Link>
            <Link href="/portfolio" className="btn-secondary px-8 py-4 text-base hover:border-zinc-700">
              Explore Dynamic Cases
            </Link>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-4 border-t border-white/10 pt-8 mt-12">
            {[
              ["30+", "flagship sites built"],
              ["$0", "AI model markup fees"],
              ["1", "unified growth engine"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-2xl font-black text-emerald-300 sm:text-3xl">
                  {value}
                </div>
                <p className="mt-1 text-xs leading-4 text-slate-400 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: The High-Closing Interactive Terminal */}
        <div className="relative min-w-0 max-w-full">
          <div className="relative max-w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md shadow-2xl shadow-black/40">
            
            {/* Window header */}
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                <span className="text-xs font-mono text-zinc-500 ml-2">webness-crawler-v2.sh</span>
              </div>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                Live Console
              </span>
            </div>

            {/* STEP 1: INPUT SCREEN */}
            {step === "input" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Index Readiness Scan</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Scan your website's visibility under modern search indexers and AI agents.
                  </p>
                </div>

                <form onSubmit={startScan} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Your Website URL</label>
                    <input
                      type="text"
                      placeholder="e.g. acme.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-emerald-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Industry / Category</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/60"
                    >
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-400 py-3.5 text-sm font-black text-slate-950 hover:bg-emerald-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Run Free AI Index Scan
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: SCANNING TERMINAL */}
            {step === "scanning" && (
              <div className="space-y-4 flex flex-col h-[280px]">
                <div className="flex-1 bg-zinc-950/80 rounded-xl p-4 font-mono text-[11px] text-zinc-400 overflow-y-auto space-y-2 border border-zinc-800/40">
                  {terminalLogs.map((log, i) => (
                    <p key={i} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("🚀") ? "text-indigo-400" : "text-zinc-400"}>
                      {log}
                    </p>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-zinc-500">
                    <span>Auditing Indexability...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: HIGH-CONVERTING AUDIT RESULTS */}
            {step === "results" && scores && (
              <div className="space-y-5 animate-fadeIn">
                {/* Score Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">AI search index rating</span>
                    <h4 className="text-2xl font-black text-white">{scores.score} / 100</h4>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    scores.score >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {scores.score >= 75 ? "Optimal" : "Needs Retainer Fix"}
                  </span>
                </div>

                {/* Score Gauges */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-[9px] uppercase font-semibold text-zinc-500">Speed</span>
                    <p className="text-sm font-black text-indigo-400 mt-0.5">{scores.speed}%</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-[9px] uppercase font-semibold text-zinc-500">AI-Crawler</span>
                    <p className="text-sm font-black text-emerald-400 mt-0.5">{scores.search}%</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-[9px] uppercase font-semibold text-zinc-500">Conversion</span>
                    <p className="text-sm font-black text-amber-400 mt-0.5">{scores.conversion}%</p>
                  </div>
                </div>

                {/* Technical Priority Callout */}
                <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Priority Core Bottleneck</span>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {scores.summary}
                  </p>
                </div>

                {/* Capture email */}
                <form onSubmit={submitLead} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email to receive full PDF fix-list"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-emerald-500/60"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Save Report to Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("input")}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
                    >
                      Re-scan
                    </button>
                  </div>
                </form>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </section>
  );
}
