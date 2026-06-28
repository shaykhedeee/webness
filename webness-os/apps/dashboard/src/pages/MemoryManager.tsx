import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Trash2,
  PlusCircle,
  Loader2,
  Sparkles,
  Shield,
  Briefcase,
  Layers,
  Database,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

type MemoryItem = {
  id: string;
  contentType: "brand_voice" | "correction" | "research";
  content: string;
  metadata?: any;
  createdAt: string;
};

type ConnectorConfig = {
  executionMode: string;
  localConfig: {
    brainUrl: string;
    janUrl: string | null;
    obsidianVault: string | null;
  };
};

export default function MemoryManager() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"brand_voice" | "correction">("brand_voice");
  const [config, setConfig] = useState<ConnectorConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const token = localStorage.getItem("webness_token");

  // Fetch dynamic memories from API
  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/ai-os/memory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMemories(data.data || []);
      } else {
        setErrorMessage(data.error || "Failed to load memories");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch memories from server");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch local connectors configuration for visual reference
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-os/connectors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchMemories();
    fetchConfig();
  }, [fetchMemories, fetchConfig]);

  // Save new manual memory
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/ai-os/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          contentType,
          metadata: { manual_entry: true, client_timestamp: new Date().toISOString() },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Preference saved to dynamic pgvector memory!");
        setContent("");
        fetchMemories();
      } else {
        setErrorMessage(data.error || "Failed to save memory preference");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while saving memory");
    } finally {
      setSaving(false);
    }
  };

  // Delete a specific memory
  const handleDeleteMemory = async (id: string) => {
    if (!window.confirm("Are you sure you want to prune this memory fact?")) return;

    try {
      const res = await fetch(`/api/ai-os/memory/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      } else {
        setErrorMessage(data.error || "Failed to prune memory");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while deleting memory");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-zinc-100">
      {/* ─── Header ─── */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 shadow-lg border border-indigo-500/10">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Memory Center</h1>
            <p className="text-sm text-zinc-400">Sovereign pgvector dynamic context & multi-agent semantic alignment</p>
          </div>
        </div>

        <button
          onClick={fetchMemories}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh Memory
        </button>
      </div>

      {/* ─── Feedback Alerts ─── */}
      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          ⚠️ {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          ✓ {successMessage}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ─── Left Sidebar: Ingest Preference ─── */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-semibold">Record Preference</h2>
            </div>
            <p className="mb-4 text-xs text-zinc-400 leading-relaxed">
              Inject custom rules, guidelines, or business parameters. These facts are indexed using vector embeddings and recalled during model runs.
            </p>

            <form onSubmit={handleSaveMemory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-400">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType("brand_voice")}
                    className={`rounded-lg py-1.5 text-xs border transition ${
                      contentType === "brand_voice"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                    }`}
                  >
                    🏛️ Brand Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType("correction")}
                    className={`rounded-lg py-1.5 text-xs border transition ${
                      contentType === "correction"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                    }`}
                  >
                    🛠️ User Rule
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-zinc-400 font-medium">Memory Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="e.g. Always write CSS layouts with glassmorphic styles and Harmony-tailored dark modes."
                  rows={4}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={!content.trim() || saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/15 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Ingesting Vector...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" /> Commit to Memory
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Connectors info */}
          {config && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 text-xs space-y-3">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <Database className="h-3.5 w-3.5 text-zinc-400" />
                Sovereign Storage Status
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>Vector Dimension</span>
                <span className="text-zinc-300 font-mono">768 (text-embedding-004)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>Obsidian Hook</span>
                <span className="text-zinc-300 font-mono">{config.localConfig.obsidianVault ? "Linked" : "Local only"}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>Execution Council</span>
                <span className="text-zinc-300 font-mono">{config.executionMode.replace(/_/g, " ")}</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: Memories List ─── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Dashboard Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/20 p-5 flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/15">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Tenant Partition</h3>
                <p className="text-sm font-bold text-zinc-200 mt-0.5">Isolated Security Space</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/20 p-5 flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Self-Improving Nodes</h3>
                <p className="text-sm font-bold text-zinc-200 mt-0.5">{memories.length} Dynamic Injections</p>
              </div>
            </div>
          </div>

          {/* Memories Main List */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <h2 className="text-base font-semibold">Active Memory Vector Table</h2>
              </div>
              <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                {memories.length} items
              </span>
            </div>

            {loading ? (
              <div className="flex h-48 flex-col items-center justify-center text-zinc-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="mt-2 text-xs">Querying vector storage...</p>
              </div>
            ) : memories.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                <Brain className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-xs font-semibold">No dynamic memories indexed yet</p>
                <p className="mt-1 text-[10px] max-w-sm px-4">
                  Add preferences using the sidebar or run agent workflows to auto-ingest corrections and feedback dynamically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/10">
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-start justify-between gap-4 p-4 hover:bg-zinc-800/20 transition-all duration-200"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                          m.contentType === "brand_voice"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/10"
                            : m.contentType === "correction"
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/10"
                            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/10"
                        }`}>
                          {m.contentType === "brand_voice" ? "🏛️ Brand Voice" : m.contentType === "correction" ? "🛠️ User Rule" : "🔬 Research"}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(m.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{m.content}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Prune memory"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
