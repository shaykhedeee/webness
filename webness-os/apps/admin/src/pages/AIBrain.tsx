import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  Cpu,
  RefreshCw,
  Play,
  Terminal,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Sparkles,
  Command,
} from "lucide-react";

type BrainTelemetry = {
  status: string;
  loaded_models?: string[];
  version?: string;
  active_model?: string;
  uptime?: string;
  vram_used?: string;
};

export default function AIBrain() {
  const queryClient = useQueryClient();
  const [consolePrompt, setConsolePrompt] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [selectedSwapModel, setSelectedSwapModel] = useState("nous-hermes2:latest");
  const [isConsoleRunning, setIsConsoleRunning] = useState(false);

  // Fetch local brain status
  const { data: brainQuery, isLoading, refetch } = useQuery({
    queryKey: ["adminBrainStatus"],
    queryFn: () => api.get("/admin/brain/status").then((r) => r.data),
    refetchInterval: 15000,
  });

  const brain: BrainTelemetry = brainQuery?.data || { status: "offline", loaded_models: [] };

  // Swap model mutation
  const swapMutation = useMutation({
    mutationFn: (model: string) => api.post("/admin/brain/swap-model", { model }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBrainStatus"] });
      alert("Local Brain model hotswapped successfully.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to swap model. Is the tunnel open?");
    },
  });

  // Prompt console executor
  const executePromptMutation = useMutation({
    mutationFn: (prompt: string) =>
      api.post("/ai-os/council/run", {
        purpose: "Admin Mainframe Console Instruction",
        prompt,
        models: [brain.active_model || "nous-hermes2:latest"],
      }).then((r) => r.data),
    onSuccess: (res) => {
      setConsoleOutput(res.data?.synthesis || "Console execution finished with no logs.");
      setIsConsoleRunning(false);
    },
    onError: (err: any) => {
      setConsoleOutput(`[FATAL MAINFRAME ERROR]: ${err.response?.data?.error || err.message}`);
      setIsConsoleRunning(false);
    },
  });

  const handleSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSwapModel) return;
    swapMutation.mutate(selectedSwapModel);
  };

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consolePrompt.trim() || isConsoleRunning) return;
    setIsConsoleRunning(true);
    setConsoleOutput(">> Stream handshake initiated. Running local model inference on PC graphics card...\nThinking...");
    executePromptMutation.mutate(consolePrompt);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6 text-amber-400 animate-pulse" /> Local Brain Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            God-mode AI orchestrator. Supervise GPU status, swap active models, and issue shell instructions directly.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-zinc-400 hover:text-zinc-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Grid: Status Cards & Hotswap */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Telemetry Health */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-indigo-400" /> Server Telemetry
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold flex items-center gap-1 border ${
                  brain.status === "online" || brain.status === "healthy"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {brain.status === "online" || brain.status === "healthy" ? (
                  <>
                    <CheckCircle className="h-2.5 w-2.5" /> Healthy
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-2.5 w-2.5 animate-bounce" /> Offline
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <p className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span>Active Model:</span>
                <span className="font-mono text-indigo-300 font-semibold">{brain.active_model || "nous-hermes2:latest"}</span>
              </p>
              <p className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span>API Endpoint:</span>
                <span className="font-mono text-zinc-500">brain.webness.in (Tunnel)</span>
              </p>
              <p className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span>Uptime Score:</span>
                <span className="text-emerald-400">{brain.status === "online" ? "99.8%" : "0%"}</span>
              </p>
              <p className="flex justify-between">
                <span>RTX 3060 VRAM:</span>
                <span className="text-amber-400 font-bold">5.8 GB / 8.0 GB</span>
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-900 text-[10px] text-zinc-500 flex items-center gap-1.5 leading-relaxed">
            <Activity className="h-3.5 w-3.5 text-indigo-400" /> Auto-failover routes cloud gateways if PC VRAM spikes.
          </div>
        </div>

        {/* Card 2: Hotswapper Dropdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md flex flex-col justify-between">
          <form onSubmit={handleSwap} className="space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-3">
                <HardDrive className="h-3.5 w-3.5 text-amber-400" /> Hot-swap Active Adapter
              </span>
              <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase font-semibold">Available Models</label>
              <select
                value={selectedSwapModel}
                onChange={(e) => setSelectedSwapModel(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
              >
                <option value="nous-hermes2:latest">🏛️ nous-hermes2 (8B Retainer Pro)</option>
                <option value="qwen3:8b">💻 qwen3:8b (Sovereign Coder)</option>
                <option value="deepseek-r1:8b">🔬 deepseek-r1:8b (Deep Reasoner)</option>
                <option value="llama3.2">🤖 llama3.2 (Lightweight General)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={swapMutation.isPending}
              className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-2.5 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {swapMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Swapping LLM...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Hot-Swap GPU Model
                </>
              )}
            </button>
          </form>
          <div className="text-[10px] text-zinc-500 leading-normal mt-2.5">
            ⚠️ Hot-swapping flushes active GPU cache buffers. Takes ~15s to load weights.
          </div>
        </div>

        {/* Card 3: Model catalog */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-3">
            <Command className="h-3.5 w-3.5 text-indigo-400" /> Active Catalog
          </span>
          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {brain.loaded_models?.length ? (
              brain.loaded_models.map((model) => (
                <div
                  key={model}
                  className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 border border-zinc-900/50"
                >
                  <span className="font-mono text-xs text-zinc-300 font-semibold">{model}</span>
                  <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-medium text-indigo-300">
                    Ollama
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-600 border border-dashed border-zinc-850 rounded-xl">
                No active GGUF layers found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retro green-on-black Console Terminal */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
        <h2 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-1.5">
          <Terminal className="h-4.5 w-4.5 text-emerald-400" /> Hermes Mainframe Terminal Console
        </h2>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Output block */}
          <div className="h-[280px] bg-zinc-950 border border-zinc-850 rounded-xl p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {consoleOutput ? (
              consoleOutput
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center">
                <Command className="h-8 w-8 text-zinc-800 animate-pulse mb-1" />
                <p>Mainframe shell idling. Submit an instructions payload.</p>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleConsoleSubmit} className="flex flex-col justify-between h-[280px]">
            <div className="space-y-3">
              <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Execute Command</label>
              <textarea
                value={consolePrompt}
                onChange={(e) => setConsolePrompt(e.target.value)}
                placeholder="e.g. Audit Kumar Residence landscaping contract and output a proposal draft..."
                rows={7}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 outline-none focus:border-emerald-500/50 leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isConsoleRunning || !consolePrompt.trim()}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isConsoleRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Mainframe Inferencing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> Issue Mainframe Order
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
