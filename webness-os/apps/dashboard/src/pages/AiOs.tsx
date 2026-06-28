import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Activity,
  BrainCircuit,
  Cable,
  CheckCircle2,
  CircleDashed,
  Cpu,
  FileText,
  Globe,
  HardDrive,
  Loader2,
  Network,
  Play,
  RefreshCw,
  Server,
  Settings2,
  Sparkles,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
  ArrowRight,
  TrendingUp,
  Inbox,
  GitBranch,
  Edit2,
  Trash2,
  Code,
  Copy,
  GitMerge,
  Search,
  Sliders,
  Database,
} from "lucide-react";
import api from "../lib/api.js";
import WorkflowBuilder from "../components/WorkflowBuilder.js";
import CostAnalytics from "../components/CostAnalytics.js";

type Connector = {
  provider: string;
  kind: string;
  configured: boolean;
  model: string;
};

type SystemHealth = {
  ollama: { online: boolean; models: string[]; version: string };
  jan: { online: boolean; models: string[] };
  hermes: { online: boolean; version: string };
  api: { online: boolean };
  redis: { online: boolean };
  postgres: { online: boolean };
};

export default function AiOs() {
  const [activeTab, setActiveTab] = useState<"system" | "branching" | "ooda" | "odysseus">("system");

  // Odysseus AI Workspace States
  const [researchQuery, setResearchQuery] = useState("Analysis of RTX 3060 local AI performance metrics");
  const [researchSteps, setResearchSteps] = useState(3);
  const [researchLogs, setResearchLogs] = useState<string[]>([]);
  const [researchResult, setResearchResult] = useState("");
  const [researchLoading, setResearchLoading] = useState(false);

  const [codePrompt, setCodePrompt] = useState("Create a React Custom Hook to fetch paginated database logs with auto-polling and retry options");
  const [codeModel, setCodeModel] = useState("deepseek-r1:8b");
  const [codeTasks, setCodeTasks] = useState<Record<string, string> | null>(null);
  const [codeOutputs, setCodeOutputs] = useState<string[]>([]);
  const [codeFinalCode, setCodeFinalCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  // Existing States
  const [prompt, setPrompt] = useState("Create a 30-day execution system for Webness to sell AI websites, SEO audits, and ebook lead magnets.");
  const [purpose, setPurpose] = useState("Webness business command run");
  const [syncing, setSyncing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const [health, setHealth] = useState<SystemHealth>({
    ollama: { online: false, models: [], version: "" },
    jan: { online: false, models: [] },
    hermes: { online: false, version: "" },
    api: { online: false },
    redis: { online: false },
    postgres: { online: false },
  });

  const [agents, setAgents] = useState([
    { name: "Claude Agent", role: "Coding & Design Subagent", provider: "claude-code", status: "Idle", lastAction: "Finalizing project type-checking build" },
    { name: "Codex Agent", role: "Computer Control & Playwright", provider: "codex", status: "Idle", lastAction: "Awaiting ebook publishing queues" },
    { name: "Nous Hermes", role: "Local Memory & Gateway Chat", provider: "hermes", status: "Ready", lastAction: "Streaming Hermes chat interface active" },
    { name: "Gemini OS Core", role: "Long-Context Synthesis Core", provider: "gemini", status: "Active", lastAction: "Scanning pgvector databases" },
    { name: "Antigravity OS", role: "System Orchestrator & Task Scheduler", provider: "antigravity", status: "Active", lastAction: "Monitoring background sync metrics" },
  ]);

  // Scene Branching Tab States
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchName, setBranchName] = useState("Option Alpha");
  const [branchDesc, setBranchDesc] = useState("Alternative room layout and color scheme");
  const [proposalTitle, setProposalTitle] = useState("Modify branch state colors");
  const [proposalChanges, setProposalChanges] = useState(`{ "primaryColor": "#312e81", "layoutObjects": 4 }`);
  const [expectedRoi, setExpectedRoi] = useState("75");
  const [canvasObjects, setCanvasObjects] = useState<string[]>(["chair-1", "table-1"]);
  const [renderPrompt, setRenderPrompt] = useState("Photorealistic interior render of modern minimal living room");
  
  // OODA Ingestion States
  const [ingestSource, setIngestSource] = useState("email");
  const [ingestTitle, setIngestTitle] = useState("Client Request: Modernize Lounge");
  const [ingestContent, setIngestContent] = useState("Hi Webness, I need the lounge design updated. Can we try a dark blue theme and add a larger sofa? Make sure it aligns with Delaware safety codes.");
  const [actualRoiInput, setActualRoiInput] = useState("85");
  const [actualProfitabilityInput, setActualProfitabilityInput] = useState("600");
  const [evaluationComments, setEvaluationComments] = useState("Applied changes, client highly satisfied. Standard Delaware regulations complied with.");

  // Tanstack Queries & Mutations
  const connectors = useQuery({
    queryKey: ["ai-os-connectors"],
    queryFn: () => api.get("/ai-os/connectors").then((r) => r.data),
  });

  const { data: branchesData, refetch: refetchBranches } = useQuery({
    queryKey: ["scene-branches"],
    queryFn: () => api.get("/scene-branches").then((r) => r.data),
    enabled: activeTab === "branching" || activeTab === "ooda",
  });

  const { data: branchDetail, refetch: refetchBranchDetail } = useQuery({
    queryKey: ["branch-detail", selectedBranchId],
    queryFn: () => api.get(`/scene-branches/${selectedBranchId}`).then((r) => r.data),
    enabled: !!selectedBranchId && activeTab === "branching",
  });

  const { data: ingestedData, refetch: refetchIngested } = useQuery({
    queryKey: ["ooda-ingested"],
    queryFn: () => api.get("/ooda/ingested").then((r) => r.data),
    enabled: activeTab === "ooda",
  });

  const createBranchMutation = useMutation({
    mutationFn: () =>
      api
        .post("/scene-branches", {
          name: branchName,
          description: branchDesc,
          state: { objects: canvasObjects },
        })
        .then((r) => r.data),
    onSuccess: () => {
      refetchBranches();
      alert("Scene branch created successfully!");
    },
  });

  const createProposalMutation = useMutation({
    mutationFn: () => {
      let parsedChanges = {};
      try {
        parsedChanges = JSON.parse(proposalChanges);
      } catch {}
      return api
        .post(`/scene-branches/${selectedBranchId}/proposal`, {
          title: proposalTitle,
          changes: parsedChanges,
          disposition: "ADVANCED_AI",
          wagerMetrics: { expectedRoi: parseFloat(expectedRoi), confidence: 0.9 },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      refetchBranchDetail();
      alert("Proposal draft submitted with wagers!");
    },
  });

  const approveProposalMutation = useMutation({
    mutationFn: ({ proposalId, decision }: { proposalId: string; decision: string }) =>
      api
        .post(`/scene-branches/proposals/${proposalId}/approve`, {
          decision,
          comments: "User reviewed and approved state modifications.",
        })
        .then((r) => r.data),
    onSuccess: () => {
      refetchBranchDetail();
      refetchBranches();
      alert("Proposal approved! Changes merged and downstream nodes invalidated recursively.");
    },
  });

  const triggerRenderMutation = useMutation({
    mutationFn: () =>
      api
        .post(`/scene-branches/${selectedBranchId}/renders`, {
          prompt: renderPrompt,
          parameters: { width: 1024, height: 768 },
        })
        .then((r) => r.data),
    onSuccess: () => {
      refetchBranchDetail();
      alert("ComfyUI Stable Diffusion rendering completed!");
    },
  });

  const ingestMutation = useMutation({
    mutationFn: () =>
      api
        .post("/ooda/ingest", {
          source: ingestSource,
          title: ingestTitle,
          content: ingestContent,
        })
        .then((r) => r.data),
    onSuccess: () => {
      refetchIngested();
      alert("Observation ingested into Getting Things Done database!");
    },
  });

  const routeIngestedMutation = useMutation({
    mutationFn: (ingestId: string) => api.post(`/ooda/ingest/${ingestId}/route`, {}).then((r) => r.data),
    onSuccess: () => {
      refetchIngested();
      refetchBranches();
      alert("Observation routed! Context oriented using Obsidian graph and Proposal generated successfully.");
    },
  });

  const evaluateOutcomeMutation = useMutation({
    mutationFn: (proposalId: string) =>
      api
        .post(`/ooda/proposals/${proposalId}/evaluate`, {
          actualRoi: actualRoiInput,
          actualProfitability: actualProfitabilityInput,
          comments: evaluationComments,
        })
        .then((r) => r.data),
    onSuccess: () => {
      refetchBranches();
      if (selectedBranchId) {
        refetchBranchDetail();
      }
      alert("Verdict metrics evaluated! Learning feedback logged to /v1/learn pgvector graph.");
    },
  });

  const manualInvalidateMutation = useMutation({
    mutationFn: () =>
      api.post(`/scene-branches/${selectedBranchId}/invalidate`, { nodeType: "scene_branch" }).then((r) => r.data),
    onSuccess: () => {
      refetchBranchDetail();
      refetchBranches();
      alert("Branch state manually marked as STALE downstream!");
    },
  });

  const enhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const token = localStorage.getItem("webness_token");
      const res = await fetch("/api/ai-os/prompt/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      } else {
        alert(data.error || "Failed to enhance prompt");
      }
    } catch (err: any) {
      alert(err.message || "Failed to enhance prompt due to network issue");
    } finally {
      setEnhancing(false);
    }
  };

  const councilRun = useMutation({
    mutationFn: () =>
      api
        .post("/ai-os/council/run", {
          purpose,
          prompt,
          maxTokens: 5000,
        })
        .then((r) => r.data),
  });

  const runDeepResearch = async () => {
    if (!researchQuery.trim() || researchLoading) return;
    setResearchLoading(true);
    setResearchLogs(["Initiating Odysseus local Second Brain indexing...", "Target: Obsidian Vault & Workspace Context"]);
    setResearchResult("");
    try {
      const token = localStorage.getItem("webness_token");
      const res = await fetch("/api/ai-os/odysseus/deep-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: researchQuery, steps: researchSteps }),
      });
      const data = await res.json();
      if (data.success) {
        setResearchLogs(data.logs || []);
        setResearchResult(data.brief || "");
      } else {
        setResearchLogs((prev) => [...prev, `Error: ${data.error || "Failed to complete research"}`]);
      }
    } catch (err: any) {
      setResearchLogs((prev) => [...prev, `Network error: ${err.message || "Failed to complete research"}`]);
    } finally {
      setResearchLoading(false);
    }
  };

  const runCodeDelegation = async () => {
    if (!codePrompt.trim() || codeLoading) return;
    setCodeLoading(true);
    setCodeTasks(null);
    setCodeOutputs([]);
    setCodeFinalCode("");
    try {
      const token = localStorage.getItem("webness_token");
      const res = await fetch("/api/ai-os/coder/delegate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: codePrompt, model: codeModel || null }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeTasks(data.tasks);
        setCodeOutputs(data.subagent_outputs || []);
        setCodeFinalCode(data.final_code || "");
      } else {
        alert(data.error || "Failed to run code delegation");
      }
    } catch (err: any) {
      alert(err.message || "Failed to run code delegation due to network error");
    } finally {
      setCodeLoading(false);
    }
  };


  // Health checks
  useEffect(() => {
    async function checkHealth() {
      const newHealth = { ...health };

      try {
        const ollamaRes = await fetch("http://localhost:11434/api/tags");
        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          const ollamaVersion = await fetch("http://localhost:11434/api/version")
            .then((r) => r.json())
            .catch(() => ({ version: "?" }));
          newHealth.ollama = {
            online: true,
            models: (data.models || []).map((m: any) => m.name),
            version: ollamaVersion.version || "0.24+",
          };
        }
      } catch {
        newHealth.ollama = { online: false, models: [], version: "" };
      }

      try {
        const janRes = await fetch("http://localhost:1337/v1/models");
        if (janRes.ok) {
          const data = await janRes.json();
          newHealth.jan = {
            online: true,
            models: (data.data || []).map((m: any) => m.id),
          };
        }
      } catch {
        newHealth.jan = { online: false, models: [] };
      }

      try {
        const apiRes = await fetch("/api/health");
        newHealth.api = { online: apiRes.ok };
      } catch {
        newHealth.api = { online: false };
      }

      try {
        const hermesRes = await fetch("http://127.0.0.1:8642/health");
        if (hermesRes.ok) {
          const data = await hermesRes.json();
          newHealth.hermes = {
            online: true,
            version: data.version || "1.0.0",
          };
        } else {
          newHealth.hermes = { online: false, version: "" };
        }
      } catch {
        newHealth.hermes = { online: false, version: "" };
      }

      setHealth(newHealth);
    }

    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const syncObsidian = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.post("/ai-os/obsidian/sync");
      if (res.data?.success) {
        setSyncResult({ success: true, message: "Sync started! Files are chunked and imported into local brain." });
      } else {
        setSyncResult({ success: false, message: res.data?.error || "Sync failed to start." });
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.response?.data?.error || err.message || "Failed to trigger sync." });
    } finally {
      setSyncing(false);
    }
  };

  const connectorList: Connector[] = connectors.data?.data?.connectors || [];
  const configuredCount = connectorList.filter((connector) => connector.configured).length;

  // Auto select branch
  useEffect(() => {
    if (branchesData?.data?.length && !selectedBranchId) {
      setSelectedBranchId(branchesData.data[0].id);
    }
  }, [branchesData, selectedBranchId]);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-300">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                Webness AI OS Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Command center for all AI operations. Manage local models, OODA captures, wagers, and version-controlled scene branches.
              </p>
            </div>
            
            {/* Tab Controls */}
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
              {[
                { id: "system", label: "Health & Council", icon: Activity },
                { id: "branching", label: "Scene Branches", icon: GitBranch },
                { id: "ooda", label: "OODA Ingest", icon: Inbox },
                { id: "odysseus", label: "Odysseus Workspace", icon: Sparkles },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Metric icon={Network} label="Mode" value="Hybrid SaaS" accent="indigo" />
            <Metric
              icon={Cable}
              label="Connected"
              value={`${configuredCount}/${connectorList.length || 10}`}
              accent="emerald"
            />
            <Metric
              icon={Server}
              label="Local Brain"
              value={health.ollama.online ? "Online" : "Offline"}
              accent={health.ollama.online ? "emerald" : "red"}
            />
            <Metric
              icon={HardDrive}
              label="Jan AI"
              value={health.jan.online ? "Online" : "Offline"}
              accent={health.jan.online ? "emerald" : "red"}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Activity className="h-4 w-4 text-indigo-300" />
            System Health
          </h2>
          <div className="space-y-2.5 text-sm text-zinc-400">
            <StatusLine
              active={health.hermes.online}
              label={`Nous Hermes Agent ${health.hermes.version ? `v${health.hermes.version}` : ""} (Local API)`}
            />
            <StatusLine
              active={health.ollama.online}
              label={`Ollama ${health.ollama.version ? `v${health.ollama.version}` : ""} (${health.ollama.models.length} models)`}
            />
            <StatusLine
              active={health.jan.online}
              label={`Jan AI (${health.jan.models.length} models loaded)`}
            />
            <StatusLine
              active={Boolean(connectorList.find((c) => c.provider === "gemini")?.configured)}
              label="Google Gemini 2.5 Pro/Flash"
            />
          </div>
        </div>
      </section>

      {/* ─── SYSTEM TAB ─── */}
      {activeTab === "system" && (
        <>
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Cpu className="h-4 w-4 text-indigo-300" />
              Multi-Agent Command Hub
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-lg border border-zinc-850 bg-zinc-950 p-4 transition hover:border-zinc-700 hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-300">{agent.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                      agent.status === "Active" || agent.status === "Ready" || agent.status === "Running"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">{agent.role}</p>
                  <div className="mt-3 rounded border border-zinc-900 bg-zinc-950 p-2 font-mono text-[9px] text-zinc-400">
                    <span className="text-zinc-600 font-semibold">[LOG]</span> {agent.lastAction}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Cpu className="h-4 w-4 text-indigo-300" />
                Connector Matrix
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {connectorList.map((connector) => (
                  <div
                    key={connector.provider}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">{connector.provider.replace(/-/g, " ")}</span>
                      {connector.configured ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-zinc-600" />
                      )}
                    </div>
                    <p className="text-xs uppercase tracking-wide text-zinc-600">{connector.kind}</p>
                    <p className="mt-2 truncate text-xs text-zinc-400">{connector.model}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Terminal className="h-4 w-4 text-amber-300" />
                Local Models
              </h2>
              <div className="space-y-2">
                {health.ollama.models.map((model) => (
                  <div
                    key={`ollama-${model}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-sm font-medium">{model}</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">Ollama</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
                  <BrainCircuit className="h-5 w-5 text-indigo-400" />
                  Obsidian Second Brain Sync
                </h2>
                <p className="text-sm text-zinc-400">Sync markdown notes into pgvector knowledge graphs.</p>
              </div>
              <button
                onClick={syncObsidian}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
              >
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Obsidian"}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Play className="h-4 w-4 text-indigo-300" />
              Parallel Council
            </h2>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <input
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none"
                  placeholder="Purpose"
                />
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none"
                  placeholder="Ask the council..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => councilRun.mutate()}
                    disabled={councilRun.isPending || !prompt.trim()}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Run Council
                  </button>
                  <button
                    onClick={enhancePrompt}
                    disabled={enhancing}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
                  >
                    Enhance Prompt
                  </button>
                </div>
              </div>

              <div>
                {councilRun.data?.data ? (
                  <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-850 bg-zinc-950 p-4 text-xs leading-5 text-zinc-300">
                    {councilRun.data.data.synthesis}
                  </pre>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950 py-20 text-center text-zinc-500">
                    Council synthesis output will appear here.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ─── BRANCHING TAB ─── */}
      {activeTab === "branching" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] flex-1 min-h-0">
          {/* Branch management panel */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-indigo-400" /> Scene Branch Explorer
                </h2>
                {branchDetail?.data?.isStale ? (
                  <span className="rounded bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400">STALE STATE</span>
                ) : (
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">FRESH STATE</span>
                )}
              </div>

              {/* Branch Selector */}
              <div className="flex gap-2">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none text-zinc-300"
                >
                  {(branchesData?.data || []).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isStale ? "(Stale)" : "(Fresh)"}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => manualInvalidateMutation.mutate()}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 text-zinc-300"
                >
                  Force Invalidate
                </button>
              </div>

              {/* Create new branch form */}
              <div className="border-t border-zinc-850 pt-4 space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase">Spawn New Branch</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="rounded border border-zinc-750 bg-zinc-950 px-2 py-1 text-xs outline-none"
                    placeholder="Branch name"
                  />
                  <input
                    value={branchDesc}
                    onChange={(e) => setBranchDesc(e.target.value)}
                    className="rounded border border-zinc-750 bg-zinc-950 px-2 py-1 text-xs outline-none"
                    placeholder="Branch description"
                  />
                </div>
                <button
                  onClick={() => createBranchMutation.mutate()}
                  className="w-full rounded bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs py-2"
                >
                  Create Scene Branch
                </button>
              </div>
            </div>

            {/* Drawing canvas mockup */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-400" /> Interactive Drawing Canvas
              </h2>
              
              <div className="relative h-64 rounded-lg bg-zinc-950 border border-zinc-850 p-4 overflow-hidden flex flex-col justify-between">
                {/* Render objects visually */}
                <div className="flex gap-3 flex-wrap">
                  {canvasObjects.map((obj) => (
                    <div key={obj} className="rounded bg-indigo-900/35 border border-indigo-500/20 px-3 py-2 text-xs text-indigo-200 shadow-sm flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                      {obj}
                      <button onClick={() => setCanvasObjects((prev) => prev.filter((o) => o !== obj))} className="text-[10px] text-zinc-500 hover:text-red-400 ml-1">×</button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center gap-2 border-t border-zinc-900 pt-3">
                  <div className="flex gap-1.5">
                    {["sofa-1", "chair-2", "table-2", "light-1"].map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          if (!canvasObjects.includes(item)) {
                            setCanvasObjects([...canvasObjects, item]);
                          }
                        }}
                        className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={async () => {
                      await api.post(`/scene-branches/${selectedBranchId}/drawings`, {
                        name: "Main Canvas",
                        canvasData: { objects: canvasObjects }
                      });
                      alert("Canvas saved!");
                    }}
                    className="rounded bg-indigo-650 hover:bg-indigo-600 px-3.5 py-1 text-xs text-white font-semibold"
                  >
                    Save Canvas
                  </button>
                </div>
              </div>
            </div>

            {/* Stable diffusion renders */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-400" /> Stable Diffusion Rendering (ComfyUI)
              </h2>

              <div className="flex gap-2">
                <input
                  value={renderPrompt}
                  onChange={(e) => setRenderPrompt(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs outline-none text-zinc-300"
                  placeholder="SD Prompt..."
                />
                <button
                  onClick={() => triggerRenderMutation.mutate()}
                  disabled={triggerRenderMutation.isPending}
                  className="rounded-lg bg-indigo-650 hover:bg-indigo-600 px-4 text-xs font-semibold text-white"
                >
                  Generate Render
                </button>
              </div>

              {branchDetail?.data?.renders?.length ? (
                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  {branchDetail.data.renders.map((r: any) => (
                    <div key={r.id} className="relative rounded overflow-hidden border border-zinc-800 bg-zinc-950 group">
                      <img src={r.url} alt="SD Render" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent p-2.5 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-zinc-300 line-clamp-1">{r.prompt}</p>
                        <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Seed: {r.id.substring(0, 8)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-6">No rendering outputs yet.</p>
              )}
            </div>
          </div>

          {/* Proposals & wager feedback loop panel */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" /> Proposals & Wagers
              </h2>

              {/* Proposal creation */}
              <div className="space-y-3 border border-zinc-800 bg-zinc-950 p-4 rounded-lg">
                <h3 className="text-xs font-bold text-zinc-400 uppercase">Draft Proposal</h3>
                
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Proposal Title</label>
                  <input
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs outline-none"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Expected ROI (%)</label>
                    <input
                      value={expectedRoi}
                      onChange={(e) => setExpectedRoi(e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">State Modifications (JSON)</label>
                    <input
                      value={proposalChanges}
                      onChange={(e) => setProposalChanges(e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={() => createProposalMutation.mutate()}
                  className="w-full rounded bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs py-2 mt-2"
                >
                  Submit Proposal Wager
                </button>
              </div>

              {/* Proposals list */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-zinc-300">Active Proposals on Branch</h3>
                {branchDetail?.data?.proposals?.length ? (
                  branchDetail.data.proposals.map((p: any) => {
                    const wager = p.wagerMetrics || {};
                    const verdict = p.verdictMetrics || {};
                    return (
                      <div key={p.id} className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-200">{p.title}</h4>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {p.id.substring(0, 8)}</p>
                          </div>
                          <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                            p.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : p.status === "REJECTED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : p.status === "EVALUATED"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Wager system details */}
                        <div className="grid gap-2 grid-cols-2 text-[10px] bg-zinc-900 p-2.5 rounded border border-zinc-850">
                          <div>
                            <span className="text-zinc-500 block">Expected ROI:</span>
                            <span className="font-semibold text-amber-400">{wager.expectedRoi || "N/A"}%</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Outcome ROI:</span>
                            <span className="font-semibold text-emerald-400">{verdict.actualRoi !== undefined ? `${verdict.actualRoi}%` : "Pending"}</span>
                          </div>
                        </div>

                        {/* Approve/Evaluate Action buttons */}
                        {p.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveProposalMutation.mutate({ proposalId: p.id, decision: "APPROVED" })}
                              className="flex-1 rounded bg-emerald-650 hover:bg-emerald-600 text-xs py-1 text-white font-bold"
                            >
                              Approve Merge
                            </button>
                            <button
                              onClick={() => approveProposalMutation.mutate({ proposalId: p.id, decision: "REJECTED" })}
                              className="flex-1 rounded bg-zinc-900 border border-zinc-800 text-xs py-1 text-zinc-400 hover:text-zinc-300 font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {p.status === "APPROVED" && (
                          <div className="space-y-2 border-t border-zinc-900 pt-2.5">
                            <h5 className="text-[10px] font-bold text-zinc-400 uppercase">Evaluate Wager verdict</h5>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <input
                                value={actualRoiInput}
                                onChange={(e) => setActualRoiInput(e.target.value)}
                                className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] outline-none"
                                placeholder="Actual ROI %"
                              />
                              <input
                                value={actualProfitabilityInput}
                                onChange={(e) => setActualProfitabilityInput(e.target.value)}
                                className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] outline-none"
                                placeholder="Actual Profit ($)"
                              />
                            </div>
                            <button
                              onClick={() => evaluateOutcomeMutation.mutate(p.id)}
                              className="w-full rounded bg-purple-650 hover:bg-purple-600 text-[10px] font-bold text-white py-1.5"
                            >
                              Evaluate & Log Outcome
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center">No proposals on this branch yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── OODA TAB ─── */}
      {activeTab === "ooda" && (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] flex-1 min-h-0">
          {/* Capturing box */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-indigo-400" /> Ingestion Inbox (Capture Everything)
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Capture all inputs—emails, Slack messages, transcripts, YouTube scripts—directly into the database inbox.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Observation Source</label>
                <select
                  value={ingestSource}
                  onChange={(e) => setIngestSource(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs outline-none text-zinc-300"
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack Message</option>
                  <option value="transcript">Meeting Transcript</option>
                  <option value="youtube">YouTube Script</option>
                  <option value="manual">Manual Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Observation Title</label>
                <input
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Observation Content</label>
                <textarea
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-3 text-xs leading-relaxed outline-none focus:border-indigo-500"
                  placeholder="Paste observation content here..."
                />
              </div>
            </div>

            <button
              onClick={() => ingestMutation.mutate()}
              disabled={ingestMutation.isPending}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {ingestMutation.isPending ? "Capturing..." : "Capture Observation"}
            </button>
          </div>

          {/* Observations routing list */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col min-h-0">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-850 pb-3 mb-4">
              <Inbox className="h-5 w-5 text-indigo-400" /> Route Captured Observations
            </h2>

            <div className="flex-1 overflow-auto space-y-3 max-h-[480px]">
              {ingestedData?.data?.length ? (
                ingestedData.data.map((item: any) => (
                  <div key={item.id} className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">{item.title}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Source: {item.source.toUpperCase()}</span>
                      </div>
                      <span className={`rounded px-2.5 py-0.5 text-[9px] font-bold ${
                        item.status === "ROUTED"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{item.content}</p>

                    {item.status === "UNPROCESSED" ? (
                      <button
                        onClick={() => routeIngestedMutation.mutate(item.id)}
                        disabled={routeIngestedMutation.isPending}
                        className="w-full flex items-center justify-center gap-1.5 rounded bg-indigo-650 hover:bg-indigo-600 text-xs py-1.5 text-white font-bold"
                      >
                        {routeIngestedMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Orient & Route Disposition"}
                      </button>
                    ) : (
                      <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-900 flex justify-between items-center">
                        <span>Routed Disposition: <span className="font-semibold text-indigo-400">{item.disposition}</span></span>
                        {item.proposalId && <span>Proposal ID: {item.proposalId.substring(0, 8)}</span>}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-zinc-600">No observations captured yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ODYSSEUS TAB ─── */}
      {activeTab === "odysseus" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] flex-1 min-h-0">
          
          {/* Left Column: Deep Research & Model Cookbook */}
          <div className="space-y-6">
            
            {/* Deep Research Box */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Search className="h-5 w-5 text-indigo-400" /> Odysseus Deep Research Console
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Privacy-first local agent executing recursive search, reasoning, and synthesis cycles over your notes & files.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Research Topic or Query</label>
                <textarea
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2 text-xs leading-relaxed outline-none focus:border-indigo-500 text-zinc-300 font-sans"
                  placeholder="Ask Odysseus to research something in your local context..."
                />
              </div>

              <div className="flex items-center justify-between gap-4 bg-zinc-950/50 p-3 rounded-lg border border-zinc-850">
                <div className="flex-1 flex items-center gap-3">
                  <Sliders className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Research depth: <span className="font-bold text-indigo-400">{researchSteps} cycles</span></span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={researchSteps}
                    onChange={(e) => setResearchSteps(Number(e.target.value))}
                    className="flex-1 max-w-[120px] accent-indigo-500"
                  />
                </div>
                <button
                  onClick={runDeepResearch}
                  disabled={researchLoading || !researchQuery.trim()}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-550 hover:to-purple-550 px-5 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-50"
                >
                  {researchLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      Run Deep Research
                    </>
                  )}
                </button>
              </div>

              {/* Research Logs Telemetry */}
              {(researchLoading || researchLogs.length > 0) && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Agent Telemetry Logs</span>
                  <div className="rounded-lg border border-zinc-850 bg-zinc-950 p-4 font-mono text-[10px] text-zinc-400 space-y-1.5 max-h-[140px] overflow-y-auto">
                    {researchLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-zinc-600">[{idx + 1}]</span>
                        <span className={log.startsWith("Error") ? "text-red-400" : log.startsWith("Final") ? "text-emerald-400" : "text-zinc-300"}>{log}</span>
                      </div>
                    ))}
                    {researchLoading && (
                      <div className="flex items-center gap-2 text-indigo-400 animate-pulse mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Odysseus is thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Research Brief Results */}
              {researchResult && (
                <div className="space-y-2 border-t border-zinc-800 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-400" /> Synthesized Research Brief
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(researchResult);
                        alert("Research brief copied to clipboard!");
                      }}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 px-2 py-1 rounded"
                    >
                      <Copy className="h-3 w-3" /> Copy Report
                    </button>
                  </div>
                  <div className="rounded-lg border border-zinc-850 bg-zinc-950/70 p-4 max-h-[320px] overflow-y-auto text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-sans">
                    {researchResult}
                  </div>
                </div>
              )}
            </div>

            {/* Model Cookbook */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-400" /> Local Model Cookbook (RTX 3060 Target)
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  VRAM budget and model configurations to ensure best results without hardware lockup.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-zinc-850 bg-zinc-950 p-3.5 space-y-1">
                  <div className="flex justify-between font-semibold text-zinc-300">
                    <span>Orchestrator Plan Core</span>
                    <span className="text-indigo-400">8B Params</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">deepseek-r1:8b / hermes3:8b</p>
                  <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900/50">
                    <span>Target VRAM:</span>
                    <span className="font-bold">~6.0 GB</span>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-850 bg-zinc-950 p-3.5 space-y-1">
                  <div className="flex justify-between font-semibold text-zinc-300">
                    <span>Coding Subagent Triumvirate</span>
                    <span className="text-indigo-400">1.5B - 3B Params</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">qwen2.5-coder:3b (x3 parallel)</p>
                  <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900/50">
                    <span>Target VRAM (Total):</span>
                    <span className="font-bold">~4.5 GB (Concurrently)</span>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-850 bg-zinc-950 p-3.5 space-y-1">
                  <div className="flex justify-between font-semibold text-zinc-300">
                    <span>Semantic Context Indexer</span>
                    <span className="text-indigo-400">Embeddings</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">nomic-embed-text</p>
                  <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900/50">
                    <span>Target VRAM:</span>
                    <span className="font-bold">~0.5 GB</span>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-850 bg-zinc-950 p-3.5 space-y-1">
                  <div className="flex justify-between font-semibold text-zinc-300">
                    <span>Triage & Task Router</span>
                    <span className="text-indigo-400">1.2B Params</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">gemma3:1b / qwen2.5:1.5b</p>
                  <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900/50">
                    <span>Target VRAM:</span>
                    <span className="font-bold">~1.2 GB</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/50 p-3 text-[11px] text-indigo-300 leading-relaxed flex gap-2 items-start">
                <Sparkles className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  <strong className="font-semibold text-indigo-200">RTX 3060 12GB VRAM Optimization:</strong> Using 1.5B/3B models for the coding subagents allows running all three concurrently alongside a heavy 8B reasoning/planner model. Configure Ollama concurrency settings to allow parallel executions without context swapping overhead.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hierarchical Code Architect */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Code className="h-5 w-5 text-indigo-400" /> Hierarchical Code Triumvirate Architect
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Delegate complex requests to a concurrent coding triumvirate managed by a master planner.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Coding Task Prompt</label>
                <textarea
                  value={codePrompt}
                  onChange={(e) => setCodePrompt(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-3 text-xs leading-relaxed outline-none focus:border-indigo-500 text-zinc-300 font-mono"
                  placeholder="Describe the component, function, or script you need built..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Master Planner Model</label>
                  <select
                    value={codeModel}
                    onChange={(e) => setCodeModel(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs outline-none text-zinc-300"
                  >
                    <option value="deepseek-r1:8b">deepseek-r1:8b (Recommended Reasoning)</option>
                    <option value="hermes3:8b">hermes3:8b (Advanced Function Core)</option>
                    <option value="qwen2.5:7b">qwen2.5:7b (Fast Generalist)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={runCodeDelegation}
                    disabled={codeLoading || !codePrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-50"
                  >
                    {codeLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Executing Delegation...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="h-4 w-4" />
                        Run Coding Triumvirate
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Interactive Flowchart / Workflow visualization */}
              {(codeLoading || codeTasks) && (
                <div className="space-y-3 pt-3 border-t border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Live Delegation Pipeline Flowchart</span>
                  
                  {/* Master Planner */}
                  <div className="flex flex-col items-center">
                    <div className="rounded-lg border border-indigo-550/30 bg-indigo-950/20 px-4 py-2 text-center max-w-[280px]">
                      <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Master Planner / Coordinator</div>
                      <div className="text-xs font-semibold text-zinc-200 mt-1">{codeModel}</div>
                      <div className="text-[9px] text-zinc-400 mt-1 font-sans">
                        {codeLoading && !codeTasks ? "Decomposing task..." : "Decomposed task into 3 parallel sub-tasks"}
                      </div>
                    </div>
                    
                    {/* Downward flow arrows */}
                    <div className="h-4 w-0.5 bg-zinc-700 my-1" />
                    <div className="flex items-center w-full justify-between max-w-[420px] px-8">
                      <div className="h-0.5 flex-1 bg-zinc-700" />
                      <div className="h-2 w-2 rounded-full bg-zinc-700 shrink-0 mx-1" />
                      <div className="h-0.5 flex-1 bg-zinc-700" />
                    </div>
                  </div>

                  {/* Parallel Subagents */}
                  <div className="grid gap-3 grid-cols-3">
                    {/* Subagent Alpha */}
                    <div className={`rounded-lg border p-3 flex flex-col justify-between transition-colors ${
                      codeLoading && !codeTasks 
                        ? "border-zinc-800 bg-zinc-950/40 opacity-50"
                        : codeLoading && codeTasks 
                        ? "border-indigo-500/50 bg-indigo-950/15"
                        : "border-emerald-500/30 bg-emerald-950/5"
                    }`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-indigo-400 uppercase">Agent Alpha</span>
                          {codeLoading && !codeTasks ? (
                            <CircleDashed className="h-3 w-3 text-zinc-600" />
                          ) : codeLoading ? (
                            <Loader2 className="h-3 w-3 text-indigo-400 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                        <div className="text-[9px] font-semibold text-zinc-300 mt-1">Interfaces & Types</div>
                        <p className="text-[8px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                          {codeTasks ? codeTasks.task1 : "Awaiting decomposition..."}
                        </p>
                      </div>
                      <div className="text-[7px] font-mono text-zinc-500 mt-2 border-t border-zinc-900/50 pt-1">
                        Model: qwen-3b
                      </div>
                    </div>

                    {/* Subagent Beta */}
                    <div className={`rounded-lg border p-3 flex flex-col justify-between transition-colors ${
                      codeLoading && !codeTasks 
                        ? "border-zinc-800 bg-zinc-950/40 opacity-50"
                        : codeLoading && codeTasks 
                        ? "border-indigo-500/50 bg-indigo-950/15"
                        : "border-emerald-500/30 bg-emerald-950/5"
                    }`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-indigo-400 uppercase">Agent Beta</span>
                          {codeLoading && !codeTasks ? (
                            <CircleDashed className="h-3 w-3 text-zinc-600" />
                          ) : codeLoading ? (
                            <Loader2 className="h-3 w-3 text-indigo-400 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                        <div className="text-[9px] font-semibold text-zinc-300 mt-1">Core Logic / State</div>
                        <p className="text-[8px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                          {codeTasks ? codeTasks.task2 : "Awaiting decomposition..."}
                        </p>
                      </div>
                      <div className="text-[7px] font-mono text-zinc-500 mt-2 border-t border-zinc-900/50 pt-1">
                        Model: qwen-3b
                      </div>
                    </div>

                    {/* Subagent Gamma */}
                    <div className={`rounded-lg border p-3 flex flex-col justify-between transition-colors ${
                      codeLoading && !codeTasks 
                        ? "border-zinc-800 bg-zinc-950/40 opacity-50"
                        : codeLoading && codeTasks 
                        ? "border-indigo-500/50 bg-indigo-950/15"
                        : "border-emerald-500/30 bg-emerald-950/5"
                    }`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-indigo-400 uppercase">Agent Gamma</span>
                          {codeLoading && !codeTasks ? (
                            <CircleDashed className="h-3 w-3 text-zinc-600" />
                          ) : codeLoading ? (
                            <Loader2 className="h-3 w-3 text-indigo-400 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                        <div className="text-[9px] font-semibold text-zinc-300 mt-1">Integration / API</div>
                        <p className="text-[8px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                          {codeTasks ? codeTasks.task3 : "Awaiting decomposition..."}
                        </p>
                      </div>
                      <div className="text-[7px] font-mono text-zinc-500 mt-2 border-t border-zinc-900/50 pt-1">
                        Model: qwen-3b
                      </div>
                    </div>
                  </div>

                  {/* Integration Merging */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center w-full justify-between max-w-[420px] px-8">
                      <div className="h-0.5 flex-1 bg-zinc-700" />
                      <div className="h-2 w-2 rounded-full bg-zinc-700 shrink-0 mx-1" />
                      <div className="h-0.5 flex-1 bg-zinc-700" />
                    </div>
                    <div className="h-4 w-0.5 bg-zinc-700 my-1" />
                    
                    <div className={`rounded-lg border px-4 py-2 text-center max-w-[280px] ${
                      codeLoading && codeFinalCode 
                        ? "border-emerald-500/30 bg-emerald-950/10"
                        : codeLoading 
                        ? "border-zinc-800 bg-zinc-950/40 opacity-50"
                        : "border-emerald-500/30 bg-emerald-950/5"
                    }`}>
                      <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 justify-center">
                        <GitMerge className="h-3 w-3" /> Master Integrator
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-1">
                        {codeLoading && !codeFinalCode 
                          ? "Awaiting subagents..." 
                          : codeFinalCode 
                          ? "Merged & resolved syntax successfully!" 
                          : "Awaiting execution..."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Code output display box */}
              {codeFinalCode && (
                <div className="space-y-2 border-t border-zinc-800 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Code className="h-4 w-4 text-indigo-400" /> Generated Unified Production File
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(codeFinalCode);
                        alert("Unified file copied to clipboard!");
                      }}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 px-2 py-1 rounded"
                    >
                      <Copy className="h-3 w-3" /> Copy Code
                    </button>
                  </div>
                  <pre className="rounded-lg border border-zinc-850 bg-zinc-950 p-4 max-h-[300px] overflow-auto text-left font-mono text-[10px] text-zinc-300 leading-relaxed">
                    <code>{codeFinalCode}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent = "indigo",
}: {
  icon: any;
  label: string;
  value: string;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-300",
    emerald: "text-emerald-300",
    red: "text-red-400",
    amber: "text-amber-300",
  };
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <Icon className={`mb-3 h-4 w-4 ${colors[accent] || colors.indigo}`} />
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function StatusLine({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {active ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      ) : (
        <CircleDashed className="h-4 w-4 text-zinc-600" />
      )}
      <span>{label}</span>
    </div>
  );
}
