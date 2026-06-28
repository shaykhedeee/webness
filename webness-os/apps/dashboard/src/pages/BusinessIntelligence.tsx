import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import {
  Calculator,
  TrendingUp,
  Clock,
  DollarSign,
  Sparkles,
  FileText,
  CheckCircle,
  Briefcase,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";

type Recommendation = {
  id: string;
  toolSlug: string;
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  impact: string;
  roi: string;
};

export default function BusinessIntelligence() {
  const navigate = useNavigate();

  // ROI Calculator inputs
  const [clientName, setClientName] = useState("");
  const [clientWebsite, setClientWebsite] = useState("webness.in");
  const [monthlySpend, setMonthlySpend] = useState(1500);
  const [manualHours, setManualHours] = useState(30);

  const [services, setServices] = useState({
    seoAudit: true,
    blogWriter: true,
    leadScraper: false,
    aiReporters: true,
  });

  const [proposalOutput, setProposalOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch dynamic advisor recommendations
  const { data: advisorQuery, isLoading: isAdvisorLoading, refetch: refetchAdvisor } = useQuery({
    queryKey: ["advisorNextSteps"],
    queryFn: () => api.get("/advisor/next-steps").then((r) => r.data),
  });

  const recommendations: Recommendation[] = advisorQuery?.data?.recommendations || [];
  const healthMetrics = advisorQuery?.data?.healthMetrics || {
    seo: 45,
    content: 30,
    speed: 75,
    lead: 40,
    overall: 48,
  };

  // Tool execution trigger
  const executeMutation = useMutation({
    mutationFn: (slug: string) => {
      // Pre-populate input based on tool type
      const input = slug === "seo_auditor" ? { url: clientWebsite || "webness.in" } : { topic: `AI Growth for ${clientName || "our industry"}` };
      return api.post(`/tools/${slug}/execute`, { input }).then((r) => r.data);
    },
    onSuccess: (res) => {
      alert("Pipeline enqueued successfully! Redirecting to tracking center...");
      navigate(`/projects/${res.data.taskId}`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Task execution failed. Check credits.");
    },
  });

  // ROI financial math
  const webnessCost = 499;
  const hourlyRate = 50;
  const manualLaborCost = manualHours * hourlyRate;
  const totalTraditionalCost = monthlySpend + manualLaborCost;
  const aiTokenCost = services.blogWriter ? 12 : 3;
  const totalWebnessCost = webnessCost + aiTokenCost;
  const netMonthlySavings = totalTraditionalCost - totalWebnessCost;
  const roiPercentage = Math.round((netMonthlySavings / totalWebnessCost) * 100);
  const annualSavings = netMonthlySavings * 12;

  const toggleService = (key: keyof typeof services) => {
    setServices((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const generateProposal = () => {
    setIsGenerating(true);
    setProposalOutput("");

    const clientSafeName = clientName || "Your Business";
    const clientSafeSite = clientWebsite || "yourwebsite.com";

    const pitchText = `
# B2B RETAINER PROPOSAL: DIGITAL AUTOPILOT MOAT
**Prepared for:** ${clientSafeName} (${clientSafeSite})
**Prepared by:** Webness OS platform
**Date:** June 1, 2026

---

### Executive Summary
${clientSafeName} currently spends an estimated **$${totalTraditionalCost.toLocaleString()}/month** in marketing retainers and manual workflow hours. By deploying **Webness OS** integrated with serverless AI automation and the **BYOK (Bring Your Own Key) Moat**, we will migrate your entire content, technical SEO, and report operations onto autopilot.

This results in an immediate monthly savings of **$${netMonthlySavings.toLocaleString()}/month** (**$${annualSavings.toLocaleString()}/year**) while increasing content frequency by 400%.

---

### Core Deployments
${services.seoAudit ? `1. **Technical SEO Auditor (Autopilot)**: Automated weekly crawler scans title tags, performance indexes, and content hierarchy.\n` : ""}
${services.blogWriter ? `2. **Creative Blog Writer Agent (Autopilot)**: Structured outline -> draft -> critique pipeline, drafting high-converting, semantically optimized articles weekly.\n` : ""}
${services.leadScraper ? `3. **Custom Lead Qualification Scraper**: Targeted local scrapers running deep searches to find, filter, and score prospective leads in your area.\n` : ""}
${services.aiReporters ? `4. **Daily Focus & Execution Sync**: Integrating operational trackers showing exactly how your digital growth ties to team focus index.\n` : ""}

---

### The BYOK Moat (Direct Cost Advantage)
Traditional agencies charge up to a **10x markup** on AI generation credits. With Webness OS, we implement a **BYOK architecture**:
* You input your own direct API credentials (Groq, OpenAI, or Gemini).
* You pay **$0 markup**—direct API fees (typically <$0.02 per blog post).
* Full operational privacy with bank-grade AES-256 encryption.

---

### Financial Blueprint & ROI
* **Traditional Monthly Spend**: $${totalTraditionalCost.toLocaleString()}
* **Webness OS Retainer + API Cost**: $${totalWebnessCost.toLocaleString()}
* **Net Monthly Savings**: $${netMonthlySavings.toLocaleString()}
* **Return on Investment**: ${roiPercentage}%
* **Annualized Cash Back**: $${annualSavings.toLocaleString()}

---

### Next Steps & Activation
1. **Infrastructure Provisioning**: Deploying the multi-tenant Webness instance.
2. **BYOK Vault Handshake**: Configuring your encrypted Groq/Gemini client keys.
3. **Autopilot Activate**: Triggering the initial baseline SEO Audit and Content Schedule.

**Let's Autopilot Your Brand. Click 'Accept' to initialize the Webness OS.**
`;

    let i = 0;
    const interval = setInterval(() => {
      setProposalOutput((prev) => prev + pitchText.charAt(i));
      i++;
      if (i >= pitchText.length) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 2);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-zinc-100 to-indigo-400 bg-clip-text text-transparent">
            Webness BI Advisor & Retainer Engine
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Proactive marketing audit intelligence, dynamic ROI analysis, and one-click agent dispatching.
          </p>
        </div>
        <button
          onClick={() => refetchAdvisor()}
          className="rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5 hover:bg-indigo-500/20 transition"
        >
          {isAdvisorLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh Insights
        </button>
      </div>

      {/* ─── AI Advisor Section ─── */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" /> Real-time Growth Operations & Recommendations
        </h2>

        {/* Health Scores Telemetry */}
        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          <HealthDial label="SEO Audit" value={healthMetrics.seo} max={100} accent="indigo" />
          <HealthDial label="Creative Content" value={healthMetrics.content} max={100} accent="emerald" />
          <HealthDial label="Site Uptime" value={healthMetrics.speed} max={100} accent="amber" />
          <HealthDial label="Local Leads" value={healthMetrics.lead} max={100} accent="purple" />
          <HealthDial label="Unified Health" value={healthMetrics.overall} max={100} accent="cyan" />
        </div>

        {/* Dynamic AI Recommendation cards */}
        {isAdvisorLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
            <p className="text-xs">Hermes Council is auditing organization database metrics...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                      {rec.toolSlug.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        rec.priority === "HIGH"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : rec.priority === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-200 mb-1">{rec.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">{rec.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-900">
                  <div className="text-[10px] text-zinc-500 space-y-1">
                    <p><strong className="text-zinc-400">Impact:</strong> {rec.impact}</p>
                    <p><strong className="text-zinc-400">ROI Moat:</strong> {rec.roi}</p>
                  </div>
                  <button
                    onClick={() => executeMutation.mutate(rec.toolSlug)}
                    disabled={executeMutation.isPending}
                    className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {executeMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        One-Click Execute <ArrowUpRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── ROI retained Engine ─── */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-400" /> Retainer Input Gauges
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Client Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Services"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Target Website</label>
                <input
                  type="text"
                  value={clientWebsite}
                  onChange={(e) => setClientWebsite(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 outline-none transition focus:border-indigo-500/60"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Traditional Agency Retainer</label>
                  <span className="text-xs font-bold text-indigo-400">${monthlySpend}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-zinc-600 flex justify-between mt-1"><span>$0</span><span>$2,500</span><span>$5,000+</span></span>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Internal Workflow Overhead</label>
                  <span className="text-xs font-bold text-indigo-400">{manualHours} hrs/mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manualHours}
                  onChange={(e) => setManualHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-zinc-600 flex justify-between mt-1"><span>0 hours</span><span>50 hours</span><span>100+ hours</span></span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-400" /> Retainer Autopilot Inclusions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleService("seoAudit")}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition ${
                  services.seoAudit
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                    : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                Weekly SEO Audits
              </button>
              <button
                onClick={() => toggleService("blogWriter")}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition ${
                  services.blogWriter
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                    : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                Autopilot Content Engine
              </button>
              <button
                onClick={() => toggleService("leadScraper")}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition ${
                  services.leadScraper
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                    : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                Local Lead Scraper
              </button>
              <button
                onClick={() => toggleService("aiReporters")}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition ${
                  services.aiReporters
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                    : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                Habit Sync Analytics
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Financial ROI Dashboard */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-indigo-400" /> Retainer ROI
              </span>
              <p className="text-2xl font-black text-indigo-400 mt-1">{roiPercentage}%</p>
              <p className="text-[10px] text-zinc-500 mt-1">Direct efficiency multiplier</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-400" /> Monthly Savings
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">${netMonthlySavings.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Replaced overhead</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-md col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" /> Annual Savings
              </span>
              <p className="text-2xl font-black text-amber-400 mt-1">${annualSavings.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Capital saved yearly</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Comparative Cost Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Traditional Retainer + Overhead Waste</span>
                  <span className="text-zinc-300 font-bold">${totalTraditionalCost.toLocaleString()}/mo</span>
                </div>
                <div className="h-4 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800/40">
                  <div className="h-full rounded-lg bg-red-500/20 border-r border-red-500/50" style={{ width: "100%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-medium">Webness Autopilot Retainer (Sovereign BYOK)</span>
                  <span className="text-emerald-300 font-bold">${totalWebnessCost.toLocaleString()}/mo</span>
                </div>
                <div className="h-4 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800/40">
                  <div className="h-full rounded-lg bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border-r border-emerald-400/80 transition-all duration-500" style={{ width: `${Math.min(100, (totalWebnessCost / totalTraditionalCost) * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-800/40 pt-4 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> BYOK: Direct LLM connection, 0% markup.</span>
              <span className="font-bold text-emerald-400">Save ${netMonthlySavings.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md flex flex-col h-[340px]">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" /> AutomatedRetainer Proposal Pitch Deck
              </h3>
              <button
                onClick={generateProposal}
                disabled={isGenerating}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-500 transition flex items-center gap-1 disabled:opacity-50"
              >
                {isGenerating ? "Compiling..." : "Generate Retainer Pitch"} <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex-1 bg-zinc-950/80 rounded-xl p-4 font-mono text-[11px] text-zinc-400 overflow-y-auto space-y-2 leading-relaxed border border-zinc-800/40 whitespace-pre-wrap">
              {proposalOutput ? (
                proposalOutput
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center">
                  <Sparkles className="mb-2 h-8 w-8 text-indigo-500/40 animate-pulse" />
                  <p className="text-xs">Adjust retainer gauges on the left, then click</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1">"Generate Retainer Pitch"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthDial({
  label,
  value,
  max = 100,
  accent = "indigo",
}: {
  label: string;
  value: number;
  max?: number;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10",
    emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    purple: "text-purple-400 bg-purple-500/5 border-purple-500/10",
    cyan: "text-cyan-400 bg-cyan-500/5 border-cyan-500/10",
  };

  const barColors: Record<string, string> = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    cyan: "bg-cyan-500",
  };

  return (
    <div className={`rounded-xl border p-4 text-center ${colors[accent] || colors.indigo}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
      <p className="text-2xl font-black mt-1">{value}%</p>
      <div className="mt-2.5 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColors[accent] || barColors.indigo}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
