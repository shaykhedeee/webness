import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth.js";
import { formatCredits, timeAgo } from "../lib/utils.js";
import api from "../lib/api.js";
import { 
  Zap, 
  FolderKanban, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  BrainCircuit, 
  Activity, 
  Sparkles, 
  Terminal 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: projects } = useQuery({
    queryKey: ["projects", { limit: 5 }],
    queryFn: () => api.get("/projects?limit=5").then((r) => r.data),
  });

  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.get("/credits/balance").then((r) => r.data),
  });

  const stats = [
    {
      label: "System Wallet Credits",
      value: formatCredits(credits?.data?.balance ?? user?.creditBalance ?? 0),
      icon: CreditCard,
      color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    },
    {
      label: "Active Pipelines",
      value: projects?.pagination?.total ?? "0",
      icon: FolderKanban,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    },
    {
      label: "Subscription Plan",
      value: user?.organization?.plan ?? "FREE DEMO",
      icon: Zap,
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & System Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-zinc-100 to-purple-400 bg-clip-text text-transparent">
            Webness Command Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Running in hybrid Cloud Fallback mode. Local PC bypass active.
          </p>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Cloud API Gateway Online
          </span>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            pgvector Memory Active
          </span>
        </div>
      </div>

      {/* ─── Premium Spaceship B2B KPI Gauges ─────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Metric 1: Digital / SEO Health (Webness Moat) */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md hover:border-indigo-500/30 transition group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-indigo-500/5 blur-[30px] group-hover:bg-indigo-500/10 transition-colors" />
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-400">SEO & Core Web Vitals</span>
            </div>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400 border border-indigo-500/20">Optimal</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">88</span>
            <span className="text-zinc-500 text-sm">/ 100 Health</span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
          </div>
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            Crawler checks title tags, performance indexes, image alt metrics, and structure.
          </p>
        </div>

        {/* Metric 2: Focus & Habits Score (Resurgo Integration) */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md hover:border-emerald-500/30 transition group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-[30px] group-hover:bg-emerald-500/10 transition-colors" />
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-400">Resurgo Focus Index</span>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">High Focus</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">92%</span>
            <span className="text-zinc-500 text-sm">Flow State</span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          </div>
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            Syncing focus sprints, completed review habits, and active Resurgo AI Coach sessions.
          </p>
        </div>

        {/* Metric 3: Biological Vitality (Whole Lot of Nature) */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md hover:border-amber-500/30 transition group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-amber-500/5 blur-[30px] group-hover:bg-amber-500/10 transition-colors" />
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-400">Bio Energy Optimization</span>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">Optimal</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">85%</span>
            <span className="text-zinc-500 text-sm">Energy Baseline</span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
          </div>
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            Reflecting energy levels, morning supplement stacks, sleep quality, and biological health.
          </p>
        </div>
      </div>

      {/* ─── Standard Stats Grid ─────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 backdrop-blur-sm transition-transform hover:scale-[1.01] ${stat.color}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <stat.icon className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Columns Section (Logs vs Projects) ─────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Live Logs Terminal widget */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md flex flex-col h-[320px]">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" /> Webness Mainframe Engine Logs
            </h2>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">Live SSE</span>
          </div>

          <div className="flex-1 bg-zinc-950/80 rounded-xl p-3 font-mono text-[11px] text-zinc-400 overflow-y-auto space-y-2 leading-relaxed border border-zinc-800/40">
            <p className="text-zinc-600">{"[2026-05-25 06:12:14] SYSTEM: Initializing core cluster routing..."}</p>
            <p className="text-emerald-400">{"[2026-05-25 06:12:15] HANDSHAKE: Cloud Fallback Engine online. GROQ & OPENAI keys verified."}</p>
            <p className="text-indigo-400">{"[2026-05-25 06:12:16] MEMORY: Cosine distance pgvector extensions loaded."}</p>
            <p className="text-amber-400">{"[2026-05-25 06:12:20] BROADCAST: Listening for BullMQ task triggers on channel 'tasks:execute'."}</p>
            <p className="text-zinc-500 animate-pulse">{"[2026-05-25 07:04:26] IDLE: Waiting for new lead-generation or content pipelines..."}</p>
          </div>
        </div>

        {/* Recent Projects list */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md flex flex-col h-[320px]">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-emerald-400" /> Recent Pipelines
            </h2>
            <a
              href="/projects"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all →
            </a>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
            {projects?.data?.length ? (
              projects.data.map((project: any) => (
                <a
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-zinc-800/20"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {project.tool?.name ?? "Task"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {timeAgo(project.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                      project.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : project.status === "FAILED"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : project.status === "PROCESSING"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    }`}
                  >
                    {project.status}
                  </span>
                </a>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Clock className="mb-2 h-8 w-8 text-zinc-600" />
                <p className="text-xs">No active pipelines found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
