import React, { useState } from "react";
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
  ShieldCheck
} from "lucide-react";

export default function DealEngine() {
  // Input states
  const [clientName, setClientName] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [monthlySpend, setMonthlySpend] = useState(1500);
  const [manualHours, setManualHours] = useState(30);
  
  // Service Toggles
  const [services, setServices] = useState({
    seoAudit: true,
    blogWriter: true,
    leadScraper: false,
    aiReporters: true,
  });

  // Proposal State
  const [proposalOutput, setProposalOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Financial Calculations
  const webnessCost = 499; // Standard Retainer base
  const hourlyRate = 50; // Manual cost of client time
  const manualLaborCost = manualHours * hourlyRate;
  
  // Calculate savings
  const totalTraditionalCost = monthlySpend + manualLaborCost;
  
  // AI tokens cost under BYOK is almost $0, compared to agency markup
  const aiTokenCost = services.blogWriter ? 12 : 3;
  const totalWebnessCost = webnessCost + aiTokenCost;
  
  const netMonthlySavings = totalTraditionalCost - totalWebnessCost;
  const roiPercentage = Math.round((netMonthlySavings / totalWebnessCost) * 100);
  const annualSavings = netMonthlySavings * 12;

  // Toggle Services helper
  const toggleService = (key: keyof typeof services) => {
    setServices(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate proposal pitch
  const generateProposal = () => {
    setIsGenerating(true);
    setProposalOutput("");
    
    const clientSafeName = clientName || "Your Business";
    const clientSafeSite = clientWebsite || "yourwebsite.com";

    const pitchText = `
# B2B RETAINER PROPOSAL: DIGITAL AUTOPILOT MOAT
**Prepared for:** ${clientSafeName} (${clientSafeSite})
**Prepared by:** Webness OS platform
**Date:** May 25, 2026

---

### Executive Summary
In today's digital landscape, local search visibility and consistent organic authority are the differences between scalable growth and expensive, declining returns on ad spend.

${clientSafeName} currently spends an estimated **$${totalTraditionalCost.toLocaleString()}/month** in marketing retainers and manual workflow hours. By deploying **Webness OS** integrated with serverless AI automation and the **BYOK (Bring Your Own Key) Moat**, we will migrate your entire content, technical SEO, and report operations onto autopilot.

This results in an immediate monthly savings of **$${netMonthlySavings.toLocaleString()}/month** (**$${annualSavings.toLocaleString()}/year**) while increasing content frequency by 400%.

---

### Core Deployments
${services.seoAudit ? `1. **Technical SEO Auditor (Autopilot)**: Automated weekly crawler scans title tags, performance indexes, and content hierarchy, streaming live reports directly to your team.\n` : ""}
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

    // Simulated typewriter stream
    let i = 0;
    const interval = setInterval(() => {
      setProposalOutput(prev => prev + pitchText.charAt(i));
      i++;
      if (i >= pitchText.length) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 3);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-zinc-100 to-indigo-400 bg-clip-text text-transparent">
            B2B Deal-Closing Engine
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Calculate instant automation ROI and write premium, high-converting retainer proposals during client pitches.
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 self-start">
          <Sparkles className="h-3.5 w-3.5" /> High-Converting Pitch Mode
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* LEFT COLUMN: Input Metrics (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-400" /> Client Profile & Metrics
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
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Current Website URL</label>
                <input 
                  type="text" 
                  placeholder="e.g. acme.com" 
                  value={clientWebsite} 
                  onChange={(e) => setClientWebsite(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-indigo-500/60"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Current Monthly Marketing Spend</label>
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
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Manual Labor Hours Spent on Content/SEO</label>
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

          {/* Core Services Selection */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-400" /> Automation Inclusions
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
                Resurgo Focus Integration
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Calculations & Live Proposal (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Financial ROI Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><TrendingUp className="h-3 w-3 text-indigo-400" /> Projected ROI</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">{roiPercentage}%</p>
              <p className="text-[10px] text-zinc-500 mt-1">Operational multiplier</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><DollarSign className="h-3 w-3 text-emerald-400" /> Monthly Savings</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">${netMonthlySavings.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Replaced manual waste</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-md col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3 text-amber-400" /> Annual Return</span>
              <p className="text-2xl font-black text-amber-400 mt-1">${annualSavings.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Capital saved yearly</p>
            </div>
          </div>

          {/* Visual Cost Comparison Chart */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Operational Cost Blueprint</h3>
            
            <div className="space-y-4">
              {/* Traditional Agency */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Traditional Retainer + Manual Time Cost</span>
                  <span className="text-zinc-300 font-bold">${totalTraditionalCost.toLocaleString()}/mo</span>
                </div>
                <div className="h-4 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800/40">
                  <div className="h-full rounded-lg bg-red-500/20 border-r border-red-500/50" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Webness OS + BYOK */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-medium">Webness OS Autopilot (Direct BYOK API costs)</span>
                  <span className="text-emerald-300 font-bold">${totalWebnessCost.toLocaleString()}/mo</span>
                </div>
                <div className="h-4 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800/40">
                  <div className="h-full rounded-lg bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border-r border-emerald-400/80 transition-all duration-500" style={{ width: `${Math.min(100, (totalWebnessCost / totalTraditionalCost) * 100)}%` }} />
                </div>
              </div>
            </div>
            
            <div className="mt-4 border-t border-zinc-800/40 pt-4 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> BYOK Moat: Direct connection, 0% markup.</span>
              <span className="font-bold text-emerald-400">Save ${netMonthlySavings.toLocaleString()}/mo</span>
            </div>
          </div>

          {/* Interactive B2B Proposal Box */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md flex flex-col h-[400px]">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" /> High-Converting Pitch Deck & Proposal
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={generateProposal}
                  disabled={isGenerating}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold hover:bg-indigo-500 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {isGenerating ? "Compiling..." : "Generate Retainer Pitch"} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-950/80 rounded-xl p-4 font-mono text-[11px] text-zinc-400 overflow-y-auto space-y-2 leading-relaxed border border-zinc-800/40 whitespace-pre-wrap">
              {proposalOutput ? (
                proposalOutput
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center">
                  <Sparkles className="mb-2 h-8 w-8 text-indigo-500/40 animate-pulse" />
                  <p className="text-xs">Configure the client metrics on the left, then click</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1">"Generate Retainer Pitch"</p>
                  <p className="text-[10px] text-zinc-600 mt-2">Outputs a premium, B2B deal-closing proposal suited for sales meetings.</p>
                </div>
              )}
            </div>
            
            {proposalOutput && !isGenerating && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(proposalOutput);
                  alert("B2B Retainer Proposal copied to clipboard!");
                }}
                className="mt-3 w-full rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Copy Proposal to Clipboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
