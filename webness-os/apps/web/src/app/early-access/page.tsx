"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// ─── Animated Counter ───────────────────────────────────────
function AnimatedNumber({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count}</>;
}

// ─── Feature Card ───────────────────────────────────────────
function FeatureCard({ icon, title, desc, badge }: { icon: string; title: string; desc: string; badge?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-emerald-500/[0.03]">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-emerald-500/[0.03] blur-[40px] transition-colors group-hover:bg-emerald-500/[0.06]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl">{icon}</span>
          {badge && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/15">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function EarlyAccessPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(0);

  // Fetch current waitlist count
  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => r.json())
      .then((d) => setWaitlistCount(d.count || 0))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus("success");
      setWaitlistCount((prev) => prev + 1);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to join waitlist.");
      setStatus("error");
    }
  };

  return (
    <>
      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-slate-950/80 backdrop-blur-xl">
        <div className="container-md flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-black text-slate-950">
              W
            </div>
            <span className="text-base font-black tracking-tight text-white">
              Webness<span className="text-emerald-400">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white transition hidden sm:block">
              Home
            </Link>
            <a
              href="#join"
              className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 transition"
            >
              Get Early Access
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#020c0b_0%,#0a1628_45%,#0f172a_100%)] pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Ambient glows */}
        <div className="absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[180px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.04] blur-[150px] pointer-events-none" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60 pointer-events-none" />

        <div className="container-md relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/15 mb-8 animate-pulse">
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
            Early Access — Limited Spots Open
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Put Your Content Marketing on{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-amber-200 bg-clip-text text-transparent">
              Autopilot
            </span>
            <br />
            <span className="text-slate-400">Without Paying 10× AI Markup</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Webness is the AI content engine that lets you{" "}
            <strong className="text-emerald-300 font-bold">bring your own API keys</strong>. Generate KDP-grade ebooks, 
            SEO-optimized blog posts, and technical audits — for pennies, not dollars.
          </p>

          {/* Email Capture Form */}
          <div id="join" className="mx-auto mt-10 max-w-md">
            {status === "success" ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center animate-fadeIn">
                <div className="text-3xl mb-3">🎉</div>
                <h3 className="text-lg font-bold text-emerald-300">You're on the list!</h3>
                <p className="text-sm text-slate-400 mt-2">
                  We'll notify you at <strong className="text-white">{email}</strong> when Webness Autopilot launches.
                  <br />
                  Your <strong className="text-emerald-300">5 free ebooks + 20% lifetime discount</strong> are locked in.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 hover:bg-emerald-300 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {status === "submitting" ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Joining...
                      </>
                    ) : (
                      "Get Early Access →"
                    )}
                  </button>
                </div>
                {errorMsg && <p className="text-xs text-red-400 font-semibold text-left">{errorMsg}</p>}
                <p className="text-[11px] text-slate-500">
                  {waitlistCount > 0 ? (
                    <>
                      <strong className="text-emerald-400"><AnimatedNumber target={waitlistCount} /></strong> founders already on the waitlist
                    </>
                  ) : (
                    "Be the first on the waitlist — no spam, ever."
                  )}
                </p>
              </form>
            )}
          </div>

          {/* Incentive Pills */}
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 max-w-lg">
            {[
              "📚 5 Free AI Ebooks",
              "💰 20% Lifetime Discount",
              "⚡ Priority Access",
              "🔐 BYOK — $0 AI Markup",
            ].map((perk) => (
              <span
                key={perk}
                className="rounded-full bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-slate-300"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON ═══ */}
      <section className="bg-slate-950 section-padding border-t border-white/[0.04]">
        <div className="container-md">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Why Founders Are Switching to{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text text-transparent">BYOK</span>
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
              Traditional AI tools charge you a subscription AND mark up every API call 5-10×. 
              Webness separates platform cost from AI cost — you pay direct.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="py-4 px-6 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Feature</th>
                  <th className="py-4 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Jasper</th>
                  <th className="py-4 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Writesonic</th>
                  <th className="py-4 px-4 text-center text-xs font-bold text-emerald-400 uppercase tracking-wider">Webness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  ["Monthly Price", "$49+", "$16+", "$29"],
                  ["AI Token Markup", "~10×", "~5×", "$0 (BYOK)"],
                  ["KDP Ebook Engine", "❌", "❌", "✅"],
                  ["SEO Auditor", "Basic", "Built-in", "Deep + AI"],
                  ["Multi-Model Pipeline", "❌", "❌", "✅ (Gemini + Groq)"],
                  ["Data Ownership", "Their servers", "Their servers", "Your keys, your data"],
                  ["Focus Coaching", "❌", "❌", "✅ (Resurgo)"],
                ].map(([feature, jasper, write, webness]) => (
                  <tr key={feature} className="hover:bg-white/[0.01] transition">
                    <td className="py-3.5 px-6 text-xs font-semibold text-slate-300">{feature}</td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500">{jasper}</td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500">{write}</td>
                    <td className="py-3.5 px-4 text-center text-xs font-bold text-emerald-400">{webness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section className="bg-[#0b1120] section-padding border-t border-white/[0.04]">
        <div className="container-md">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                Dominate
              </span>{" "}
              Content Marketing
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
              Six battle-tested AI tools. One dashboard. Zero AI markup.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="📚"
              title="KDP-Grade Ebook Engine"
              desc="Multi-model AI pipeline generates research-grounded, publish-ready ebooks with cover art, EPUB compilation, and Amazon KDP metadata."
              badge="FLAGSHIP"
            />
            <FeatureCard
              icon="📊"
              title="Automated SEO Auditor"
              desc="Deep-crawl any website for technical SEO health, Core Web Vitals, heading structure, and AI-powered fix recommendations."
            />
            <FeatureCard
              icon="✍️"
              title="AI Blog Writer Pipeline"
              desc="Research → Outline → Draft → Critique → Polish. Produces semantically optimized, long-form blog content on any topic."
            />
            <FeatureCard
              icon="🧠"
              title="Hermes AI Chat"
              desc="An intelligent assistant with pgvector memory. It remembers your brand, your audience, and your content strategy across sessions."
            />
            <FeatureCard
              icon="🔐"
              title="BYOK Vault (AES-256)"
              desc="Bring your own Gemini, Groq, or OpenAI keys. Bank-grade encryption. Zero markup on API costs. Total data sovereignty."
              badge="THE MOAT"
            />
            <FeatureCard
              icon="🎯"
              title="Resurgo Focus Integration"
              desc="Track your focus, habits, and energy alongside your business metrics. The only content tool that cares about your wellbeing."
              badge="UNIQUE"
            />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-slate-950 section-padding border-t border-white/[0.04]">
        <div className="container-md">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-white sm:text-3xl">How BYOK Saves You Thousands</h2>
          </div>

          <div className="mx-auto max-w-3xl grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Plug In Your Keys",
                desc: "Add your Gemini, Groq, or OpenAI API key to the encrypted BYOK Vault. Takes 30 seconds.",
                color: "from-emerald-500 to-emerald-600",
              },
              {
                step: "02",
                title: "Run AI Tools",
                desc: "Generate ebooks, blog posts, SEO audits — all powered by your own API keys at direct cost (~$0.02/post).",
                color: "from-indigo-500 to-indigo-600",
              },
              {
                step: "03",
                title: "Pay $0 Markup",
                desc: "Webness charges for the platform ($29/mo), not the AI. Your API costs go straight to the provider.",
                color: "from-amber-500 to-amber-600",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-lg font-black text-white shadow-lg`}>
                  {item.step}
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Math proof */}
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Jasper (1 Year)</span>
                <span className="block text-2xl font-black text-red-400 mt-1">$588+</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">$49/mo × 12 + token markup</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Webness (1 Year)</span>
                <span className="block text-2xl font-black text-emerald-400 mt-1">$348</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">$29/mo × 12 + ~$0.02/post direct</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-500/10 text-center">
              <span className="text-xs font-bold text-emerald-300">
                Save $240+/year — and you keep all your data.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EARLY ACCESS CTA ═══ */}
      <section className="bg-[linear-gradient(180deg,#0b1120_0%,#071510_100%)] section-padding border-t border-white/[0.04]">
        <div className="container-md text-center">
          <h2 className="text-2xl font-black text-white sm:text-3xl mb-4">
            Join the Waitlist. Get{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text text-transparent">
              5 Free Ebooks
            </span>
            .
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
            Sign up before launch and receive 5 AI-generated ebooks on any topic of your choice, 
            plus a permanent 20% discount on any plan. No credit card required.
          </p>

          {/* Repeat the email form */}
          <div className="mx-auto max-w-md">
            {status === "success" ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <p className="text-sm font-bold text-emerald-300">✅ You're already on the list!</p>
                <p className="text-xs text-slate-400 mt-1">We'll email you at <strong className="text-white">{email}</strong> when we launch.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "submitting"}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/40 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 hover:bg-emerald-300 transition whitespace-nowrap disabled:opacity-50"
                >
                  {status === "submitting" ? "Joining..." : "Join Waitlist →"}
                </button>
              </form>
            )}
          </div>

          {/* Credibility bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Built by Webness.in — 30+ projects
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Powered by Gemini, Groq & OpenAI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Resurgo Focus Integration
            </span>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-slate-950 border-t border-white/[0.04] py-8">
        <div className="container-md flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[10px] font-black text-slate-950">
              W
            </div>
            <span className="text-xs font-bold text-slate-400">Webness Autopilot</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <a href="https://resurgo.life" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Resurgo</a>
            <a href="https://webness.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Agency</a>
          </div>
          <p className="text-[11px] text-slate-600">
            Your data. Your keys. Your growth. © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </>
  );
}
