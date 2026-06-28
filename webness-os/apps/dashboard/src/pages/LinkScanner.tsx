import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Save,
  Flame,
  Search,
  Eye,
  Hash,
  Send,
} from "lucide-react";
import api from "../lib/api.js";

type TeardownData = {
  overview: {
    businessName: string;
    businessModel: string;
    positioning: string;
    targetAudience: string;
  };
  copywriting: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    ctaAnalysis: string;
  };
  seoAudit: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  leadContacts: {
    extractedEmails: string[];
    socialProfiles: string[];
    contactForms: string[];
  };
};

import { useNavigate } from "react-router-dom";

export default function LinkScanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "copy" | "seo" | "leads">("overview");
  const [teardown, setTeardown] = useState<TeardownData | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const seoRate = teardown ? (teardown.seoAudit.score < 80 ? 349 : 199) : 0;
  const copyRate = teardown ? (teardown.copywriting.score < 80 ? 150 : 99) : 0;
  const proposalSubtotal = seoRate + copyRate;
  const proposalTax = Math.round(proposalSubtotal * 0.18 * 100) / 100;
  const proposalTotal = Math.round((proposalSubtotal + proposalTax) * 100) / 100;

  const handleGenerateInvoice = async () => {
    if (!teardown) return;
    setIsCreatingInvoice(true);
    try {
      const email = teardown.leadContacts.extractedEmails[0] || "partner@example.com";
      const name = teardown.overview.businessName || "B2B Client Partner";
      
      const res = await api.post("/tools/invoice_generator/execute", {
        input: {
          clientName: name,
          clientEmail: email,
          items: [
            {
              description: `Website Technical & SEO Restructuring Package for ${url}`,
              quantity: 1,
              rate: seoRate,
            },
            {
              description: `Landing Page Copywriting & Call-to-Action Optimization`,
              quantity: 1,
              rate: copyRate,
            }
          ]
        }
      });
      
      if (res.data?.success && res.data?.data?.taskId) {
        alert("B2B proposal invoice generated! Redirecting to project tracking center...");
        navigate(`/projects/${res.data.data.taskId}`);
      } else {
        alert("Failed to enqueue invoice generator: " + (res.data?.error || "Unknown error"));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to trigger invoice generator.");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Mutation to scan the URL
  const scanMutation = useMutation({
    mutationFn: (targetUrl: string) =>
      api.post("/ai-os/link/scan", { url: targetUrl }).then((r) => r.data),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setTeardown(res.data);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || "Failed to scan link.");
    }
  });

  // Mutation to save the teardown to the vault
  const saveToVaultMutation = useMutation({
    mutationFn: (noteData: { title: string; content: string; folder: string; tags: string[]; source: string }) =>
      api.post("/vault", noteData).then((r) => r.data),
    onSuccess: () => {
      setSaveStatus("Teardown saved to Vault under 'Audits'!");
      queryClient.invalidateQueries({ queryKey: ["vaultNotes"] });
      setTimeout(() => setSaveStatus(null), 4000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to save report.");
    }
  });

  function handleSaveToVault() {
    if (!teardown) return;
    const cleanUrl = url.replace(/https?:\/\/(www\.)?/, "");
    const title = `${teardown.overview.businessName || cleanUrl} Website Teardown`;
    
    // Construct rich markdown report
    const content = `# Website Teardown: ${teardown.overview.businessName || cleanUrl}
**Target URL:** [${url}](${url})

---

## 🏛️ Business Overview
- **Business Model:** ${teardown.overview.businessModel}
- **Market Positioning:** ${teardown.overview.positioning}
- **Target Audience:** ${teardown.overview.targetAudience}

---

## ✍️ Copywriting Audit (Score: ${teardown.copywriting.score}/100)
### Strengths:
${teardown.copywriting.strengths.map(s => `- ${s}`).join("\n")}

### Weaknesses:
${teardown.copywriting.weaknesses.map(w => `- ${w}`).join("\n")}

### Call to Action (CTA) Analysis:
${teardown.copywriting.ctaAnalysis}

---

## 🔎 SEO & Technical Gaps (Score: ${teardown.seoAudit.score}/100)
### Key Gaps / Issues Found:
${teardown.seoAudit.issues.map(i => `- ${i}`).join("\n")}

### Actionable Optimization Recommendations:
${teardown.seoAudit.suggestions.map(s => `- ${s}`).join("\n")}

---

## 💼 Outreach Lead Dossier
- **Extracted Emails:** ${teardown.leadContacts.extractedEmails.length > 0 ? teardown.leadContacts.extractedEmails.join(", ") : "None detected"}
- **Contact Channels:** ${teardown.leadContacts.contactForms.length > 0 ? teardown.leadContacts.contactForms.join(", ") : "None detected"}
- **Social Media Profiles:** ${teardown.leadContacts.socialProfiles.length > 0 ? teardown.leadContacts.socialProfiles.join(", ") : "None detected"}
`;

    saveToVaultMutation.mutate({
      title,
      content,
      folder: "Audits",
      tags: ["link-scan", "seo-audit", "leads"],
      source: "manual"
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Deep Link Scanner & Analyst</h1>
            <p className="text-xs text-zinc-400">Scan any landing page to dissect its value prop, copy, SEO, and gather lead information.</p>
          </div>
        </div>

        {/* Input area */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500"
              placeholder="Enter target URL (e.g. https://example.com)…"
            />
          </div>
          <button
            onClick={() => scanMutation.mutate(url)}
            disabled={scanMutation.isPending || !url.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
          >
            {scanMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning website...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Audit Page
              </>
            )}
          </button>
        </div>
      </section>

      {/* Main Content (Tabs and Teardown Display) */}
      {teardown && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div className="flex gap-2">
                {(["overview", "copy", "seo", "leads"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                      activeTab === tab
                        ? "bg-indigo-500/10 text-indigo-300"
                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToVault}
                  disabled={saveToVaultMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save to Vault
                </button>
              </div>
            </div>

            {/* Tab Panels */}
            <div className="space-y-4">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Business Name</h3>
                    <p className="mt-1 text-sm text-zinc-200">{teardown.overview.businessName || "Not Extracted"}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Core Offering / Business Model</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{teardown.overview.businessModel}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Market Positioning</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{teardown.overview.positioning}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Primary Target Audience</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{teardown.overview.targetAudience}</p>
                  </div>
                </div>
              )}

              {activeTab === "copy" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Copywriting Score</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${teardown.copywriting.score >= 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {teardown.copywriting.score}/100
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Strengths</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-300">
                      {teardown.copywriting.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Weaknesses</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-300">
                      {teardown.copywriting.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">CTA (Call-to-Action) Strategy</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{teardown.copywriting.ctaAnalysis}</p>
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">SEO Score</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${teardown.seoAudit.score >= 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {teardown.seoAudit.score}/100
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Technical & On-Page Issues</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-300">
                      {teardown.seoAudit.issues.map((i, idx) => (
                        <li key={idx}>{i}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Actionable SEO Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-300">
                      {teardown.seoAudit.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "leads" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Extracted Emails</h3>
                    {teardown.leadContacts.extractedEmails.length === 0 ? (
                      <p className="text-xs text-zinc-500">No public email addresses extracted.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teardown.leadContacts.extractedEmails.map((e, idx) => (
                          <span key={idx} className="rounded bg-zinc-950 px-2 py-1 text-xs text-zinc-300 border border-zinc-800">{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Social Profiles</h3>
                    {teardown.leadContacts.socialProfiles.length === 0 ? (
                      <p className="text-xs text-zinc-500">No social media links detected.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {teardown.leadContacts.socialProfiles.map((p, idx) => (
                          <li key={idx}>
                            <a href={p} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">{p}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Forms & Inboxes</h3>
                    {teardown.leadContacts.contactForms.length === 0 ? (
                      <p className="text-xs text-zinc-500">No direct contact URLs detected.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {teardown.leadContacts.contactForms.map((f, idx) => (
                          <li key={idx} className="text-xs text-zinc-400">{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {saveStatus && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                {saveStatus}
              </div>
            )}
          </div>

          {/* Quick Lead Pitch Card */}
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
              <h2 className="flex items-center gap-2 font-bold text-zinc-100">
                <Flame className="h-4 w-4 text-orange-400" />
                Lead Strategy Pitch
              </h2>
              <p className="mt-2 text-xs text-zinc-400">
                Based on the scanned details, here is the suggested client outreach strategy:
              </p>

              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div className="rounded bg-zinc-950 p-3 border border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-400">Outbound Angle</h4>
                  <p className="mt-1 text-xs text-zinc-500 leading-5">
                    "I noticed on your page that you sell {teardown.overview.businessModel.slice(0, 50)}... 
                    but you have some gaps in your landing page copywriting and SEO score ({teardown.seoAudit.score}/100)."
                  </p>
                </div>
                <div className="rounded bg-zinc-950 p-3 border border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-400">Core Improvement Suggestion</h4>
                  <p className="mt-1 text-xs text-zinc-500 leading-5">
                    {teardown.seoAudit.suggestions[0] || "Optimize tags and CTA placement."}
                  </p>
                </div>
              </div>
            </div>

            {/* B2B Retainer Proposal / Invoice Funnel */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <FileText className="h-5 w-5 text-indigo-400" />
                <div>
                  <h2 className="font-bold text-sm text-zinc-100">B2B Retainer Proposal</h2>
                  <p className="text-[10px] text-zinc-500">Auto-calculated rates for {teardown.overview.businessName || "Client"}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>SEO Restructuring:</span>
                  <span className="font-semibold text-zinc-200">${seoRate}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Copywriting & CTA Fixes:</span>
                  <span className="font-semibold text-zinc-200">${copyRate}</span>
                </div>
                <div className="border-t border-zinc-800/60 my-2 pt-2 flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-zinc-200">${proposalSubtotal}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>GST/VAT Tax (18%):</span>
                  <span className="font-semibold">${proposalTax}</span>
                </div>
                <div className="border-t border-zinc-800/80 pt-2 flex justify-between text-sm font-bold text-emerald-400">
                  <span>Total Proposal Cost:</span>
                  <span>${proposalTotal}</span>
                </div>
              </div>

              <button
                onClick={handleGenerateInvoice}
                disabled={isCreatingInvoice}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {isCreatingInvoice ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enqueuing Proposal...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Approve & Generate Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
