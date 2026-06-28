import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Scale,
  ShieldAlert,
  Search,
  FileCheck,
  Cpu,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Copy,
} from "lucide-react";
import api from "../lib/api.js";

type RiskItem = {
  clause: string;
  riskRating: "LOW" | "MEDIUM" | "HIGH";
  issue: string;
  mitigation: string;
};

type ReviewResult = {
  overallScore: number;
  risks: RiskItem[];
  draftingGaps: string[];
};

export default function LegalAi() {
  const [activeTab, setActiveTab] = useState<"auditor" | "generator" | "courtlistener" | "mcp">("auditor");

  // NDA Auditor State
  const [contractText, setContractText] = useState(
    `MUTUAL NON-DISCLOSURE AGREEMENT\n\n` +
    `9. INDEMNIFICATION. The Receiving Party agrees to indemnify, defend, and hold harmless the Disclosing Party and its affiliates from and against any and all claims, liabilities, losses, damages, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this Agreement by the Receiving Party, without limitation.\n\n` +
    `4. SURVIVAL. The obligations of confidentiality set forth in this Agreement shall survive the termination or expiration of this Agreement indefinitely and remain in full force and effect.`
  );
  const [reviewData, setReviewData] = useState<ReviewResult | null>(null);

  const auditMutation = useMutation({
    mutationFn: (text: string) => api.post("/legal/nda-review", { contractText: text }).then((r) => r.data),
    onSuccess: (res) => {
      if (res.success) {
        setReviewData(res.data);
      }
    },
  });

  // Generator State
  const [templateType, setTemplateType] = useState("NDA");
  const [partyA, setPartyA] = useState("Webness AI Corp");
  const [partyB, setPartyB] = useState("Acme Retail Solutions");
  const [governingLaw, setGoverningLaw] = useState("Delaware");
  const [amount, setAmount] = useState("N/A");
  const [generatedDraft, setGeneratedDraft] = useState("");

  const draftMutation = useMutation({
    mutationFn: () =>
      api
        .post("/legal/draft-agreement", {
          templateType,
          partyA,
          partyB,
          governingLaw,
          amount,
        })
        .then((r) => r.data),
    onSuccess: (res) => {
      if (res.success) {
        setGeneratedDraft(res.draftText);
      }
    },
  });

  // CourtListener State
  const [searchQuery, setSearchQuery] = useState("confidentiality clause");
  const [cases, setCases] = useState<any[]>([]);

  const searchMutation = useMutation({
    mutationFn: (q: string) => api.get(`/legal/courtlistener?q=${encodeURIComponent(q)}`).then((r) => r.data),
    onSuccess: (res) => {
      if (res.success) {
        setCases(res.data);
      }
    },
  });

  // MCP Status State
  const mcpQuery = useQuery({
    queryKey: ["mcp-status"],
    queryFn: () => api.get("/legal/mcp-status").then((r) => r.data),
    refetchInterval: 15000,
  });

  const runAudit = () => {
    if (!contractText.trim()) return;
    auditMutation.mutate(contractText);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchMutation.mutate(searchQuery);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-300">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Legal AI (Mike OSS)</h1>
            <p className="text-sm text-zinc-400">
              Sovereign transactional legal co-pilot. Audit NDAs, draft commercial agreements, search case law, and bridge proprietary databases via MCPs.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex border-b border-zinc-800">
          {[
            { id: "auditor", label: "NDA Risk Auditor", icon: ShieldAlert },
            { id: "generator", label: "Agreement Generator", icon: FileCheck },
            { id: "courtlistener", label: "CourtListener Search", icon: Search },
            { id: "mcp", label: "MCP Connections", icon: Cpu },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === "auditor" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Input Panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="mb-3 text-lg font-bold text-zinc-100">Audit Agreement Text</h2>
            <p className="mb-4 text-xs text-zinc-500">
              Paste your confidentiality agreement or contract terms to audit risk ratings, clause liabilities, and compliance checks.
            </p>
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              rows={14}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-xs leading-relaxed outline-none focus:border-purple-500"
              placeholder="Paste contract text here..."
            />
            <button
              onClick={runAudit}
              disabled={auditMutation.isPending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {auditMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing contract clauses...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" /> Analyze NDA Risk Scorecard
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            {reviewData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">Audit Result</h2>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">NDA Scorecard</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center justify-center h-12 w-12 rounded-full font-bold text-lg border-2 ${
                        reviewData.overallScore >= 80
                          ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                          : reviewData.overallScore >= 60
                          ? "border-amber-500 text-amber-400 bg-amber-500/5"
                          : "border-red-500 text-red-400 bg-red-500/5"
                      }`}
                    >
                      {reviewData.overallScore}
                    </span>
                  </div>
                </div>

                {/* Risks list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-300">Identified Clause Risks</h3>
                  {reviewData.risks.map((risk, idx) => (
                    <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-200">{risk.clause}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            risk.riskRating === "HIGH"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : risk.riskRating === "MEDIUM"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {risk.riskRating}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed"><span className="text-zinc-500 font-medium">Issue:</span> {risk.issue}</p>
                      <div className="rounded border border-purple-900/30 bg-purple-950/10 p-2.5 text-[11px] text-purple-300 flex gap-2">
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-400" />
                        <div><span className="font-semibold">Mitigation:</span> {risk.mitigation}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drafting Gaps */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-bold text-zinc-300">Drafting Gaps & Exclusions</h3>
                  <ul className="list-inside list-disc space-y-1.5 text-xs text-zinc-400">
                    {reviewData.draftingGaps.map((gap, idx) => (
                      <li key={idx} className="leading-relaxed">{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center text-zinc-500">
                <FileCheck className="mb-4 h-12 w-12 text-zinc-700" />
                <p className="text-sm font-medium">Awaiting Contract Audit</p>
                <p className="mt-1 text-xs text-zinc-600 max-w-xs">
                  Paste contract clauses and run the checklist scanner to audit governing laws, indemnities, and term boundaries.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "generator" && (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Inputs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
            <h2 className="text-lg font-bold text-zinc-100">Draft Parameters</h2>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Template Type</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
              >
                <option value="NDA">Mutual Non-Disclosure Agreement (NDA)</option>
                <option value="SaaS Agreement">SaaS Terms of Service Agreement</option>
                <option value="IP Assignment">Intellectual Property Assignment</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Party A (Disclosing)</label>
                <input
                  value={partyA}
                  onChange={(e) => setPartyA(e.target.value)}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Party B (Receiving)</label>
                <input
                  value={partyB}
                  onChange={(e) => setPartyB(e.target.value)}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Governing Jurisdiction</label>
                <input
                  value={governingLaw}
                  onChange={(e) => setGoverningLaw(e.target.value)}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                  placeholder="e.g. Delaware"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Payment/Fee Value (Optional)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
                  placeholder="e.g. $5,000 / N/A"
                />
              </div>
            </div>

            <button
              onClick={() => draftMutation.mutate()}
              disabled={draftMutation.isPending}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {draftMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Drafting agreement template...
                </span>
              ) : (
                "Generate Legal Draft"
              )}
            </button>
          </div>

          {/* Editor/Draft Display */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-zinc-100">Draft Document Output</h2>
              {generatedDraft && (
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedDraft)}
                    className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                  <button
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([generatedDraft], { type: "text/plain" });
                      element.href = URL.createObjectURL(file);
                      element.download = `${templateType.replace(/\s+/g, "_")}_Draft.txt`;
                      document.body.appendChild(element);
                      element.click();
                    }}
                    className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Download className="h-3 w-3" /> Export
                  </button>
                </div>
              )}
            </div>

            {generatedDraft ? (
              <pre className="flex-1 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-850 bg-zinc-950 p-4 font-mono text-xs leading-5 text-zinc-300 max-h-[450px]">
                {generatedDraft}
              </pre>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center text-zinc-500">
                <FileCheck className="mb-4 h-12 w-12 text-zinc-700" />
                <p className="text-sm font-medium">Awaiting Drafting Request</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Select a template type, enter the contracting entities, and generate the final document draft.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "courtlistener" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="mb-3 text-lg font-bold text-zinc-100 font-sans">Search CourtListener Case Law</h2>
            <p className="mb-4 text-xs text-zinc-500">
              Query the public CourtListener case law database. Connect your own token in the environment config for real-time un-throttled data.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-purple-500"
                  placeholder="e.g. trade secret NDA breach damages"
                />
              </div>
              <button
                type="submit"
                disabled={searchMutation.isPending}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
              >
                {searchMutation.isPending ? "Searching..." : "Search Cases"}
              </button>
            </form>
          </div>

          {searchMutation.isPending ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : cases.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {cases.map((c, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">{c.title}</h3>
                    <p className="text-[11px] font-mono text-purple-400 mt-1">{c.citation}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{c.court} • {c.date}</p>
                    <p className="text-xs text-zinc-400 mt-3 italic line-clamp-3">"...{c.snippet.replace(/<[^>]+>/g, "")}..."</p>
                  </div>
                  {c.absoluteUrl && (
                    <div className="pt-4 border-t border-zinc-850 mt-4">
                      <a
                        href={c.absoluteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                      >
                        View Opinon on CourtListener <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-10 text-center text-zinc-500">
              No search results matching your query.
            </div>
          )}
        </div>
      )}

      {activeTab === "mcp" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Model Context Protocol (MCP) Host Matrix</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Mike OSS leverages MCPs as a unified protocol to interface LLMs directly with local databases, external APIs, and sandboxed runtimes.
            </p>
          </div>

          {mcpQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(mcpQuery.data?.data || []).map((mcp: any) => (
                <div key={mcp.name} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex items-start gap-4">
                  <div className={`mt-0.5 rounded-full p-1.5 ${mcp.connected ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                    {mcp.connected ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">{mcp.name}</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Type: {mcp.type}</p>
                    <p className="text-xs text-zinc-400 mt-2">{mcp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
