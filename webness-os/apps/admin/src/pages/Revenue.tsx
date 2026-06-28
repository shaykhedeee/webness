import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  TrendingUp,
  RefreshCw,
  DollarSign,
  CreditCard,
  PieChart,
  Activity,
  Calendar,
  Zap,
  Clock,
  ArrowUpRight,
} from "lucide-react";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  wallet: {
    org: { name: string; slug: string };
  };
};

type ToolUsage = {
  tool: { name: string };
  usage: number;
};

type PlanDist = {
  plan: string;
  count: number;
};

type RevenueData = {
  period: { days: number; since: string };
  credits: {
    issued: number;
    consumed: number;
  };
  topTools: ToolUsage[];
  planDistribution: PlanDist[];
  recentTransactions: Transaction[];
};

export default function Revenue() {
  const [daysFilter, setDaysFilter] = useState(30);

  // Fetch revenue analytics
  const { data: revenueQuery, isLoading, refetch } = useQuery({
    queryKey: ["adminRevenue", daysFilter],
    queryFn: () =>
      api.get("/admin/analytics/revenue", { params: { days: daysFilter } }).then((r) => r.data),
  });

  const analytics: RevenueData = revenueQuery?.data || {
    period: { days: 30, since: "" },
    credits: { issued: 0, consumed: 0 },
    topTools: [],
    planDistribution: [],
    recentTransactions: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-400" /> B2B Retainer & Revenue Hub
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Supervise credit transaction ledgers, track cash retainers, and audit operational MRR multipliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs outline-none text-zinc-300 focus:border-indigo-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-zinc-400 hover:text-zinc-200 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" /> Projected MRR Moat
          </span>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
            ${(analytics.planDistribution?.reduce((acc, curr) => {
              const pricing: Record<string, number> = { FREE: 0, STARTER: 49, PRO: 149, ENTERPRISE: 399, SAASS: 1500 };
              return acc + (pricing[curr.plan] || 0) * curr.count;
            }, 0) || 499).toLocaleString()}
          </p>
          <span className="text-[10px] text-zinc-500 block mt-2">Aggregated active B2B software retainer tiers.</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
            <CreditCard className="h-4 w-4 text-indigo-400" /> Credits Issued (Volume)
          </span>
          <p className="text-3xl font-black text-indigo-400 font-mono mt-1">
            {analytics.credits?.issued?.toLocaleString() || "0"} Cr
          </p>
          <span className="text-[10px] text-zinc-500 block mt-2">Total granted, UPI wire upgrades, and welcome gifts.</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
            <Activity className="h-4 w-4 text-amber-400" /> Pipeline Consumed (Burndown)
          </span>
          <p className="text-3xl font-black text-amber-400 font-mono mt-1">
            {analytics.credits?.consumed?.toLocaleString() || "0"} Cr
          </p>
          <span className="text-[10px] text-zinc-500 block mt-2">Credit burndown by enqueued tool executions.</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Side: Recent Transactions Ledger */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-4">
            <Clock className="h-4 w-4 text-indigo-400" /> Transaction Ledger
          </span>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
            </div>
          ) : analytics.recentTransactions?.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20">
              <p className="text-xs text-zinc-500">No B2B payment transactions logged in period.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {analytics.recentTransactions?.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/40 hover:border-zinc-800 transition"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{txn.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                      <span className="font-mono text-zinc-400 font-bold">{txn.wallet.org.name}</span>
                      <span>•</span>
                      <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-xs font-black shrink-0 ${
                      txn.amount > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {txn.amount > 0 ? `+${txn.amount}` : txn.amount} Cr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Plan distributions & Top Tools */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-3">
              <PieChart className="h-4 w-4 text-amber-400" /> Retainer plan Divisions
            </span>
            <div className="space-y-2">
              {analytics.planDistribution?.map((dist) => (
                <div
                  key={dist.plan}
                  className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-900 text-xs"
                >
                  <span className="font-semibold text-zinc-300">{dist.plan} Tier</span>
                  <span className="text-zinc-500 font-mono font-bold">{dist.count} Orgs</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-3">
              <Zap className="h-4 w-4 text-indigo-400" /> Service consumption catalog
            </span>
            <div className="space-y-2">
              {analytics.topTools?.length ? (
                analytics.topTools.map((toolUsage) => (
                  <div
                    key={toolUsage.tool.name}
                    className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-900 text-xs"
                  >
                    <span className="font-semibold text-zinc-300">{toolUsage.tool.name}</span>
                    <span className="text-indigo-400 font-mono font-semibold">
                      {toolUsage.usage} runs
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-zinc-600 text-center py-4">No content generator runs in period.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
