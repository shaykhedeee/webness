"use client";

import React, { useState } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

interface Resource {
  slug: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  points: string[];
}

const RESOURCES: Resource[] = [
  {
    slug: "playbook",
    title: "The Sovereign AI Playbook",
    category: "Operations & Architecture",
    description: "Learn how to establish a server-side Bring Your Own Key (BYOK) pipeline, eliminate vendor token markups, and run PGVector self-learning caching loops.",
    badge: "Most Requested eBook",
    points: [
      "AES-256-GCM secure encryption standards for keys",
      "pgvector similarity matching SQL structures",
      "Cost breakdown of wholesale API vs standard SaaS",
      "Zero-downtime hardware tunnel fallback logic"
    ]
  },
  {
    slug: "seo-checklist",
    title: "Search & AI Engine Readiness Checklist",
    category: "Technical SEO & Indexing",
    description: "Is your site readable by ChatGPT Search, Perplexity, and Gemini? Complete this structural markdown audit checklist to authorize crawls and citations.",
    badge: "Technical Audit Guide",
    points: [
      "Robots.txt crawlers permits configurations",
      "JSON-LD Entity schema mapping declarations",
      "Core Web Vitals & mobile parsing metrics thresholds",
      "Semantic HTML5 anchor citation formatting rules"
    ]
  },
  {
    slug: "prompt-pack",
    title: "Sovereign Prompt Skill Pack",
    category: "Prompts & AI Presets",
    description: "An importable JSON package containing our production-grade system prompts for autonomous SEO reasoning, B2B draft outlines, and critique agents.",
    badge: "Importable Prompt Config",
    points: [
      "DeepSeek-R1 inference auditor instructions",
      "Outline Generator entities prompts",
      "mechanical editorial critique instructions",
      "Standard JSON config structure"
    ]
  }
];

export default function ResourcesPage() {
  // Modal states
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [successFilename, setSuccessFilename] = useState("");

  // Handle open modal
  const openDownloadModal = (resource: Resource) => {
    setSelectedResource(resource);
    setEmail("");
    setStatus("idle");
    setProgress(0);
    setError("");
  };

  // Submit form handler
  const handleDownloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setProgress(0);

    // Simulate progress bar checking DNS / generating payload before trigger
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const response = await fetch("/api/resources-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resourceSlug: selectedResource?.slug,
        }),
      });

      const payload = await response.json();
      clearInterval(progressInterval);

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Failed to register lead.");
      }

      setProgress(100);
      setSuccessFilename(payload.filename);
      setStatus("success");

      // Auto-trigger browser file download after brief success pause
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = payload.downloadUrl;
        link.download = payload.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 800);

    } catch (err: any) {
      clearInterval(progressInterval);
      setStatus("idle");
      setProgress(0);
      setError(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#031a18_0%,#0f172a_58%,#111827_100%)] text-white pt-32 pb-24">
        
        {/* Ambient Neon Blurs */}
        <div className="absolute top-[10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[160px] pointer-events-none" />

        <div className="container-md relative z-10">
          
          {/* Header Section */}
          <div className="max-w-3xl mb-16 space-y-6">
            <span className="rounded-full bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Sovereign B2B Knowledge Vault
            </span>
            <h1 className="text-4xl font-black leading-[1.1] sm:text-6xl tracking-tight">
              Premium, free intelligence for your <span className="gradient-text">AI infrastructure</span>.
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
              Stop building fragile wrappers. Unlock professional guides, technical Entity SEO checklists, and importable skill configurations to scale your business operations with zero token markups.
            </p>
          </div>

          {/* Grid Layout of Glassmorphism Resource Cards */}
          <div className="grid gap-8 lg:grid-cols-3">
            {RESOURCES.map((resource) => (
              <article
                key={resource.slug}
                className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between hover:border-amber-400/30 transition-all duration-300 group"
              >
                {/* Accent glow on top left */}
                <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-emerald-400/5 blur-[40px] pointer-events-none" />

                <div className="space-y-6">
                  {/* Top category & badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest font-black text-amber-300">{resource.category}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                      {resource.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-black tracking-tight text-white group-hover:text-amber-300 transition duration-300">
                    {resource.title}
                  </h2>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {resource.description}
                  </p>

                  {/* Bullet previews */}
                  <div className="border-t border-zinc-800/80 pt-5 space-y-2.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 block">What you will get:</span>
                    <ul className="space-y-2">
                      {resource.points.map((pt, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2 leading-5">
                          <svg className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call To Action */}
                <button
                  onClick={() => openDownloadModal(resource)}
                  className="mt-8 w-full rounded-xl bg-zinc-950 py-3 text-xs font-black text-white border border-zinc-800 hover:bg-emerald-400 hover:text-zinc-950 hover:border-emerald-400 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Unlock Direct Access
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                  </svg>
                </button>
              </article>
            ))}
          </div>

        </div>

        {/* ─── DYNAMIC GLASSMORPHISM LEAD CAPTURE MODAL ─── */}
        {selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Modal backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedResource(null)}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 p-8 shadow-2xl backdrop-blur-xl animate-scaleIn">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedResource(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form Screen */}
              {status !== "success" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-widest font-black text-amber-300 block">{selectedResource.category}</span>
                    <h3 className="text-xl font-black text-white">Unlock Free Technical Resource</h3>
                    <p className="text-xs text-zinc-400 leading-5">
                      Enter your primary email address below to immediately download <strong className="text-zinc-200 font-bold">"{selectedResource.title}"</strong>.
                    </p>
                  </div>

                  <form onSubmit={handleDownloadSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Business Email Address</label>
                      <input
                        type="email"
                        required
                        disabled={status === "submitting"}
                        placeholder="e.g. founder@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500/60 disabled:opacity-50"
                      />
                    </div>

                    {error && <p className="text-xs text-red-400 font-bold">{error}</p>}

                    {status === "submitting" ? (
                      /* Scanning Micro-Animation Progress Bar */
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                          <span>Securing Download Route...</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-400 transition-all duration-200" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      /* Submit CTA */
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-emerald-400 py-3.5 text-xs font-black text-zinc-950 hover:bg-emerald-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Authorize & Download File
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </form>

                  <p className="text-[10px] text-center text-zinc-600 leading-4">
                    🔒 Zero spam. We only send technical AI caching blueprints and direct SaaS operational case-studies.
                  </p>
                </div>
              )}

              {/* Success Screen */}
              {status === "success" && (
                <div className="text-center py-6 space-y-6 animate-fadeIn">
                  {/* Glowing success badge */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 filter drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">Download Authorized!</h3>
                    <p className="text-xs text-zinc-400 leading-5 max-w-xs mx-auto">
                      Access verified successfully. Your browser is initiating a direct download of <strong className="text-emerald-400 font-bold">{successFilename}</strong>.
                    </p>
                  </div>

                  <div className="border-t border-zinc-900 pt-5 space-y-2">
                    <p className="text-[10px] text-zinc-500 leading-4">
                      If the download did not start automatically, click the link below:
                    </p>
                    <a
                      href={`/downloads/${successFilename}`}
                      download={successFilename}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1"
                    >
                      Click here to trigger download manually
                    </a>
                  </div>

                  <button
                    onClick={() => setSelectedResource(null)}
                    className="w-full rounded-xl bg-zinc-900 py-3 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                  >
                    Done & Close
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
