import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Save,
  Search,
  Zap,
  TrendingUp,
  Link,
  BookOpen,
  ArrowRight,
  Database,
  RefreshCw,
  Share2,
  Sliders,
  Plus,
  Trash
} from "lucide-react";
import api from "../lib/api.js";

// ─── Interfaces & Mock Types ────────────────────────────────
interface KeywordGap {
  keyword: string;
  volume: number;
  difficulty: number;
  opportunity: 'High' | 'Medium' | 'Low';
  pillar: string;
  subpillar: string;
}

interface TopicCluster {
  pillar: string;
  volume: number;
  subpillars: string[];
}

export default function HarborSeo() {
  const [sitemapUrl, setSitemapUrl] = useState("https://example.com/sitemap.xml");
  const [scanning, setScanning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"site-seeker" | "topic-scaler" | "author" | "linker" | "reworker" | "tracker">("site-seeker");
  
  // Site Seeker State
  const [keywordGaps, setKeywordGaps] = useState<KeywordGap[]>([]);
  
  // Topic Scaler State
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<TopicCluster | null>(null);

  // Author State
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [pillarContext, setPillarContext] = useState("");
  const [writingProgress, setWritingProgress] = useState(0);
  const [writingLogs, setWritingLogs] = useState<string[]>([]);
  const [generatedArticle, setGeneratedArticle] = useState<{
    title: string;
    content: string;
    internalLinksPlaced: string[];
    chartsGenerated: string[];
  } | null>(null);

  // Linker State
  const [internalLinkTargets, setInternalLinkTargets] = useState<{ anchor: string; targetUrl: string }[]>([
    { anchor: "agentic memory store", targetUrl: "/blog/shared-vector-memory" },
    { anchor: "sovereign local AI", targetUrl: "/blog/nous-hermes-setup" },
    { anchor: "cost optimization rules", targetUrl: "/blog/gemini-token-budgets" }
  ]);
  const [newAnchor, setNewAnchor] = useState("");
  const [newTargetUrl, setNewTargetUrl] = useState("");

  // Reworker State
  const [reworkUrl, setReworkUrl] = useState("");
  const [reworking, setReworking] = useState(false);
  const [reworkedSuggestions, setReworkedSuggestions] = useState<string[]>([]);

  // Rank Tracker State
  const [rankings, setRankings] = useState<{ query: string; impressions: number; position: number; change: number }[]>([
    { query: "multi agent operating system", impressions: 4500, position: 2.4, change: 1.1 },
    { query: "secure Coder Agent local daemon", impressions: 2900, position: 4.8, change: 3.2 },
    { query: "Obsidian pgvector context memory", impressions: 1800, position: 8.1, change: -0.5 },
    { query: "Nous Hermes workflow tools", impressions: 1200, position: 12.3, change: 2.4 }
  ]);

  // Handle Scanning competitor sitemap (Site Seeker)
  const handleSitemapScan = () => {
    setScanning(true);
    setTimeout(() => {
      // Mock Gaps found
      setKeywordGaps([
        { keyword: "agentic memory databases", volume: 1600, difficulty: 32, opportunity: "High", pillar: "Agentic Memory", subpillar: "Postgres Vector DB" },
        { keyword: "sandboxed terminal executing", volume: 980, difficulty: 45, opportunity: "High", pillar: "Coder Agent Security", subpillar: "Docker vs Host OS" },
        { keyword: "Nous Hermes workflow execution", volume: 850, difficulty: 28, opportunity: "Medium", pillar: "Hermes Workflows", subpillar: "Cron Scheduling" },
        { keyword: "llm cost analytics metrics", volume: 1100, difficulty: 19, opportunity: "High", pillar: "Cost Tracking", subpillar: "Gemini Flash Routing" },
        { keyword: "local websocket compiler daemon", volume: 420, difficulty: 55, opportunity: "Low", pillar: "Coder Agent Security", subpillar: "Websocket Handshake" }
      ]);

      setClusters([
        { pillar: "Agentic Memory", volume: 3200, subpillars: ["Postgres Vector DB", "Context Summarization", "Obsidian Knowledge Graph"] },
        { pillar: "Coder Agent Security", volume: 2400, subpillars: ["Docker vs Host OS", "Terminal Access Control", "Websocket Handshake"] },
        { pillar: "Hermes Workflows", volume: 1950, subpillars: ["Cron Scheduling", "Agent Swarms", "Skill Custom Executions"] },
        { pillar: "Cost Tracking", volume: 1600, subpillars: ["Gemini Flash Routing", "Real-Time Token Tracking", "Hard Budget Caps"] }
      ]);
      setScanning(false);
    }, 1500);
  };

  // Run AI Content Generation Pipeline (Author)
  const handleGenerateArticle = () => {
    if (!selectedKeyword) return;
    setWritingProgress(10);
    setWritingLogs(["[1/4] Scraping context URLs and pulling internal links list..."]);
    
    setTimeout(() => {
      setWritingProgress(40);
      setWritingLogs(prev => [...prev, "[2/4] Initializing Gemini Pro Copywriter. Writing opinionated long-form blueprint..."]);
    }, 1000);

    setTimeout(() => {
      setWritingProgress(75);
      setWritingLogs(prev => [...prev, "[3/4] Injecting automated contextual internal link anchors into draft content..."]);
    }, 2200);

    setTimeout(() => {
      setWritingProgress(100);
      setWritingLogs(prev => [...prev, "✅ [4/4] Compiled interactive SVG network architecture diagram. Polish phase complete!"]);
      
      setGeneratedArticle({
        title: `The Ultimate Blueprint for ${selectedKeyword.replace(/-/g, ' ')}`,
        content: `
# The Ultimate Blueprint for ${selectedKeyword}

In the rapidly evolving landscape of artificial intelligence, building context-aware applications is no longer optional. When you deploy a **sovereign local AI** node, maintaining state parameters is the biggest bottleneck.

## Understanding the Architecture

Traditional systems partition memory databases into simple key-value caches. However, modern multi-agent networks rely on an **agentic memory store** to persist data flows between sequential task engines.

\`\`\`
[USER PROMPT] --> [ROUTER AGENT] --> [CODER AGENT] (Sandboxed environment)
                         |
                 [SHARED VECTOR DB] <--> [MEMORIES]
\`\`\`

By configuring **cost optimization rules**, we direct summary workloads to lightweight models while saving complex logical compilation layers for reasoning networks.

## Technical Configuration Steps

To initialize this in your workspace, build a websocket daemon to handshake browser previews:
1. Validate command tokens against whitelist properties.
2. Bind local port boundaries securely to Docker workspaces.
3. Hook sitemaps to verify link building patterns automatically.
        `,
        internalLinksPlaced: ["agentic memory store", "sovereign local AI", "cost optimization rules"],
        chartsGenerated: ["Memory Architecture Diagram (SVG)", "Model Cost Routing Chart"]
      });
    }, 3500);
  };

  // Add Internal Link target
  const handleAddLinkTarget = () => {
    if (!newAnchor || !newTargetUrl) return;
    setInternalLinkTargets([...internalLinkTargets, { anchor: newAnchor, targetUrl: newTargetUrl }]);
    setNewAnchor("");
    setNewTargetUrl("");
  };

  // Run Content Reworker
  const handleReworkContent = () => {
    if (!reworkUrl) return;
    setReworking(true);
    setTimeout(() => {
      setReworkedSuggestions([
        "Optimize Heading hierarchy: Re-index 'Architecture Setup' as H2 to enforce proper search engine indexing.",
        "Add contextual internal link: Link anchor 'pgvector cache' to '/blog/postgresql-vector-database' to scale topical hub weight.",
        "Include dynamic graph: Embed a model performance SVG chart demonstrating the Coder Agent compile-speed metrics.",
        "Keyword injection: Naturally place 'sandboxed terminal execution' in paragraph 3."
      ]);
      setReworking(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Harbor SEO Command Center</h1>
            <p className="text-xs text-zinc-400">Context-Aware AI Content Suite. Build topical authority, automate sitemap linking, and publish directly.</p>
          </div>
        </div>

        {/* Sitemap Search Bar (Site Seeker Launcher) */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500"
              placeholder="Enter domain sitemap URL..."
            />
          </div>
          <button
            onClick={handleSitemapScan}
            disabled={scanning || !sitemapUrl.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Auditing Sitemap...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Site Seeker Gap Analysis
              </>
            )}
          </button>
        </div>
      </section>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        {[
          { key: "site-seeker", label: "🔍 Site Seeker", desc: "Competitor Sitemap Gaps" },
          { key: "topic-scaler", label: "🗂️ Topic Scaler", desc: "Topical Authority Hierarchy" },
          { key: "author", label: "✍️ AI Author", desc: "Opinionated Content Generator" },
          { key: "linker", label: "🔗 Internal Linker", desc: "Link Map & Anchors" },
          { key: "reworker", label: "✨ Content Reworker", desc: "Refresh Existing Posts" },
          { key: "tracker", label: "📈 Rank Tracker", desc: "Search Console Positions" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`rounded-lg px-4 py-2.5 text-left transition ${
              activeSubTab === tab.key
                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            <div className="text-xs font-bold uppercase">{tab.label}</div>
            <div className="text-[9px] text-zinc-500 mt-0.5">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* ─── Tab Content Views ─── */}
      <div className="space-y-6">
        
        {/* SITE SEEKER VIEW */}
        {activeSubTab === "site-seeker" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Sitemap Gaps & Opportunities</h3>
                <p className="text-xs text-zinc-500">Compare crawled content sitemaps to discover missing semantic topical fields.</p>
              </div>
              {keywordGaps.length > 0 && (
                <span className="text-xs text-indigo-400 font-semibold">{keywordGaps.length} Gaps Discovered</span>
              )}
            </div>

            {keywordGaps.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                <Globe className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Run the sitemap scan above to load keyword gap analytics.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                      <th className="p-3">Target Keyword Gap</th>
                      <th className="p-3">Pillar / Category</th>
                      <th className="p-3">Search Vol (Mo)</th>
                      <th className="p-3">Difficulty</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {keywordGaps.map((gap, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30">
                        <td className="p-3 font-semibold text-zinc-200">{gap.keyword}</td>
                        <td className="p-3 text-zinc-400">{gap.pillar} / {gap.subpillar}</td>
                        <td className="p-3 text-zinc-300 font-mono">{gap.volume}</td>
                        <td className="p-3 text-zinc-300 font-mono">{gap.difficulty}/100</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            gap.opportunity === 'High' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>{gap.opportunity}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedKeyword(gap.keyword);
                              setPillarContext(gap.pillar);
                              setActiveSubTab("author");
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-end gap-1 ml-auto"
                          >
                            Generate Content <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TOPIC SCALER VIEW */}
        {activeSubTab === "topic-scaler" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-200">Topical Clusters Tree</h3>
              <p className="text-xs text-zinc-500">Select clusters to scale and structure supporting content pillars.</p>

              {clusters.length === 0 ? (
                <div className="text-center py-10 text-zinc-600">Scan sitemap to fetch topical hierarchy nodes.</div>
              ) : (
                <div className="space-y-2">
                  {clusters.map((cluster, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedCluster(cluster)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        selectedCluster?.pillar === cluster.pillar ? 'bg-indigo-500/10 border-indigo-500' : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-200">{cluster.pillar}</span>
                        <span className="text-zinc-500 text-[10px] font-mono">Vol: {cluster.volume}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-zinc-200 mb-3">Cluster Hierarchy Blueprint</h3>
              {selectedCluster ? (
                <div className="space-y-4">
                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                    <span className="text-[10px] uppercase text-zinc-500">Core Pillar Page</span>
                    <h4 className="text-sm font-bold text-indigo-400 mt-1">{selectedCluster.pillar} Ultimate Guide</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase text-zinc-500 block">Supporting Sub-Pillar Posts (Internal Links target)</span>
                    {selectedCluster.subpillars.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-900 rounded-lg text-xs">
                        <span>{sub}</span>
                        <button
                          onClick={() => {
                            setSelectedKeyword(sub);
                            setPillarContext(selectedCluster.pillar);
                            setActiveSubTab("author");
                          }}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-semibold text-zinc-300"
                        >
                          Write
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-xs text-zinc-500">
                  Select a topical cluster pillar to view supporting blueprint maps.
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI AUTHOR VIEW */}
        {activeSubTab === "author" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">AI Content Author Config</h3>
                <p className="text-xs text-zinc-500">Generate long-form post loaded with anchor maps and diagrams.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Keyword Gap</label>
                  <input
                    value={selectedKeyword}
                    onChange={(e) => setSelectedKeyword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. agentic memory databases"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Pillar Context</label>
                  <input
                    value={pillarContext}
                    onChange={(e) => setPillarContext(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Agentic Memory"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateArticle}
                disabled={!selectedKeyword}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded font-bold text-xs shadow-lg shadow-indigo-500/20 transition disabled:opacity-40"
              >
                Write Opinionated Post (3,000+ words)
              </button>

              {writingProgress > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Draft progress...</span>
                    <span>{writingProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${writingProgress}%` }} />
                  </div>
                  <div className="max-h-24 overflow-y-auto bg-zinc-950 border border-zinc-900 rounded p-2 text-[9px] font-mono text-zinc-500 space-y-0.5">
                    {writingLogs.map((log, idx) => <div key={idx}>{log}</div>)}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-zinc-200">Article Editor Preview</h3>
                {generatedArticle && (
                  <button className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition">
                    <Share2 className="h-3.5 w-3.5" />
                    One-Click Publish CMS
                  </button>
                )}
              </div>

              {generatedArticle ? (
                <div className="space-y-4 max-h-[420px] overflow-y-auto">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3 font-mono text-[11px] text-zinc-400">
                    <div className="text-xs font-bold text-zinc-200 border-b border-zinc-900 pb-2">{generatedArticle.title}</div>
                    <div className="whitespace-pre-wrap">{generatedArticle.content}</div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1">Internal Link Anchor Injections</span>
                      <div className="flex flex-wrap gap-1">
                        {generatedArticle.internalLinksPlaced.map((link, idx) => (
                          <span key={idx} className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/20 font-mono">
                            {link}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1">Visual Diagrams Embedded</span>
                      <div className="flex flex-wrap gap-1">
                        {generatedArticle.chartsGenerated.map((chart, idx) => (
                          <span key={idx} className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/20 font-mono">
                            {chart}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 border border-dashed border-zinc-800 bg-zinc-950/20 rounded-xl text-xs text-zinc-500">
                  Choose a target keyword gap and generate content to display editor previews.
                </div>
              )}
            </div>
          </div>
        )}

        {/* LINKER VIEW */}
        {activeSubTab === "linker" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-200">Register Internal Linking Map</h3>
              <p className="text-xs text-zinc-500">Register site anchor texts and their target URL pages to automate contextual link insertion.</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Anchor Phrase</label>
                  <input
                    value={newAnchor}
                    onChange={(e) => setNewAnchor(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                    placeholder="e.g. agentic memory store"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target URL</label>
                  <input
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                    placeholder="e.g. /blog/shared-vector-memory"
                  />
                </div>
                <button
                  onClick={handleAddLinkTarget}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Anchor Map
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-zinc-200 mb-3">Active Anchor Anchoring Dictionary</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {internalLinkTargets.map((target, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-850 rounded-lg text-xs">
                    <div>
                      <span className="font-semibold text-zinc-200 font-mono">"{target.anchor}"</span>
                      <span className="text-zinc-500 text-[10px] block mt-0.5">Redirect: {target.targetUrl}</span>
                    </div>
                    <button
                      onClick={() => setInternalLinkTargets(internalLinkTargets.filter((_, i) => i !== idx))}
                      className="text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REWORKER VIEW */}
        {activeSubTab === "reworker" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-200">Reclaim Rank Reworker</h3>
              <p className="text-xs text-zinc-500">Provide an existing blog article URL or text draft to search for content freshness optimization gaps.</p>

              <div className="space-y-3">
                <input
                  value={reworkUrl}
                  onChange={(e) => setReworkUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                  placeholder="URL of post to refresh (e.g. /blog/old-memory-article)..."
                />
                <button
                  onClick={handleReworkContent}
                  disabled={reworking || !reworkUrl}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {reworking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Identify Refresh Gaps
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-zinc-200 mb-3">Content Refresh Action List</h3>
              {reworkedSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {reworkedSuggestions.map((sug, idx) => (
                    <div key={idx} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg text-xs leading-relaxed text-zinc-300">
                      ✅ {sug}
                    </div>
                  ))}
                  <button className="w-full py-2 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded text-xs font-bold transition">
                    Apply Rewriter Optimization Fixes
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-xs text-zinc-500">
                  Input page context and trigger gap checks to list refresh guides.
                </div>
              )}
            </div>
          </div>
        )}

        {/* RANK TRACKER VIEW */}
        {activeSubTab === "tracker" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Search Console Performance Monitor</h3>
              <p className="text-xs text-zinc-500">Live rankings and impressions for pages published from the AI OS.</p>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <th className="p-3">Search Query</th>
                    <th className="p-3">Impressions (Mo)</th>
                    <th className="p-3">Average Position</th>
                    <th className="p-3 text-right">Position Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {rankings.map((rank, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/30">
                      <td className="p-3 font-semibold text-zinc-200 font-sans">{rank.query}</td>
                      <td className="p-3 text-zinc-300">{rank.impressions.toLocaleString()}</td>
                      <td className="p-3 text-indigo-400 font-bold">{rank.position}</td>
                      <td className={`p-3 text-right ${rank.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {rank.change > 0 ? `+${rank.change}` : rank.change} positions
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
