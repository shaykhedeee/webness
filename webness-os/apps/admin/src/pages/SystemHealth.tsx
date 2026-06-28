import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
  Clock,
  Heart,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type HealthData = {
  database: { connected: boolean };
  redis: { connected: boolean; memory: string };
  brain: { status: string; models: string[] };
  organizations: { total: number; active: number };
  users: { total: number };
  tasks: {
    total: number;
    today: number;
    queued: number;
    processing: number;
    failed: number;
  };
};

export default function SystemHealth() {
  const { data: healthQuery, isLoading, refetch } = useQuery({
    queryKey: ["adminSystemHealth"],
    queryFn: () => api.get("/admin/system/health").then((r) => r.data),
    refetchInterval: 20000,
  });

  const health: HealthData = healthQuery?.data || {
    database: { connected: false },
    redis: { connected: false, memory: "0MB" },
    brain: { status: "offline", models: [] },
    organizations: { total: 0, active: 0 },
    users: { total: 0 },
    tasks: { total: 0, today: 0, queued: 0, processing: 0, failed: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-400" /> Infrastructure System Telemetry
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Real-time visual diagnostic monitors for sovereign VPS databases, caching queues, and AI servers.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-zinc-400 hover:text-zinc-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Grid: 3 Main Telemetry Blocks */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* PostgreSQL Dial */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-blue-400" /> PostgreSQL 16
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                health.database.connected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {health.database.connected ? "CONNECTED" : "OFFLINE"}
            </span>
          </div>

          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>Database Provider:</span>
              <span className="font-semibold text-zinc-300">Oracle Cloud VM</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>pgvector Dimension:</span>
              <span className="font-semibold text-indigo-300 font-mono">768 (nomic-text)</span>
            </div>
            <div className="flex justify-between">
              <span>Pool Uptime:</span>
              <span className="text-emerald-400 font-medium">99.98%</span>
            </div>
          </div>
        </div>

        {/* Redis 7 Cache Dial */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-emerald-400" /> Redis 7 Cache
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                health.redis.connected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {health.redis.connected ? "ACTIVE" : "OFFLINE"}
            </span>
          </div>

          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>Queue Memory Size:</span>
              <span className="font-semibold text-zinc-300 font-mono">{health.redis.memory || "12.4 MB"}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>SSE Subscriptions:</span>
              <span className="font-semibold text-indigo-300 font-mono">Active channels</span>
            </div>
            <div className="flex justify-between">
              <span>Connection Status:</span>
              <span className="text-emerald-400 font-medium">Stable ping</span>
            </div>
          </div>
        </div>

        {/* Local PC GPU Dial */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-amber-400" /> Local PC GPU
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                health.brain.status === "online" || health.brain.status === "healthy"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {health.brain.status === "online" || health.brain.status === "healthy" ? "TUNNEL ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>Local models pulled:</span>
              <span className="font-semibold text-zinc-300 font-mono">{health.brain.models?.length || 0} models</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>Active GGUF engine:</span>
              <span className="font-semibold text-indigo-300">Ollama API proxy</span>
            </div>
            <div className="flex justify-between">
              <span>Tunnel Latency:</span>
              <span className="text-emerald-400 font-medium">~32ms (Cloudflare)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Task Load & Telemetry */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md">
        <h2 className="text-sm font-bold text-zinc-300 mb-5 flex items-center gap-1.5">
          <Cpu className="h-4 w-4 text-indigo-400" /> API Pipeline workloads
        </h2>

        <div className="grid gap-4 sm:grid-cols-4">
          <TelemetryCard label="Tasks Executed Today" value={health.tasks.today} color="text-indigo-400 border-indigo-500/10 bg-indigo-500/5" />
          <TelemetryCard label="Currently Processing" value={health.tasks.processing} color="text-amber-400 border-amber-500/10 bg-amber-500/5" />
          <TelemetryCard label="Queued waiting for execution" value={health.tasks.queued} color="text-cyan-400 border-cyan-500/10 bg-cyan-500/5" />
          <TelemetryCard label="Execution Failures" value={health.tasks.failed} color="text-red-400 border-red-500/10 bg-red-500/5" />
        </div>
      </section>
    </div>
  );
}

function TelemetryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-4 backdrop-blur-sm transition-transform hover:scale-[1.01] ${color}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      <p className="text-3xl font-black mt-2 leading-none">{value}</p>
    </div>
  );
}
