import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CostAnalytics() {
  const [budgetLimit, setBudgetLimit] = useState(15.00);
  const [spent, setSpent] = useState(4.82);

  const usagePercent = Math.min((spent / budgetLimit) * 100, 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Metrics graph and budgets */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Budget Tracker</h3>
            <p className="text-xs text-zinc-400">Total spending across models this session.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-400 font-mono">
            ${spent.toFixed(2)} / ${budgetLimit.toFixed(2)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-[2px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>0%</span>
            <span>Usage: {usagePercent.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Simulation model routing split */}
        <div className="grid gap-3 sm:grid-cols-3 pt-3">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850">
            <span className="text-[10px] text-zinc-500 block">Gemini 2.5 Flash</span>
            <span className="text-xs font-mono font-bold text-emerald-400 mt-1 block">1,482,000 tokens</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Spent: $0.11</span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850">
            <span className="text-[10px] text-zinc-500 block">Gemini 2.5 Pro</span>
            <span className="text-xs font-mono font-bold text-indigo-400 mt-1 block">348,000 tokens</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Spent: $2.44</span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850">
            <span className="text-[10px] text-zinc-500 block">Claude 3.5 Sonnet</span>
            <span className="text-xs font-mono font-bold text-purple-400 mt-1 block">150,000 tokens</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Spent: $2.27</span>
          </div>
        </div>
      </div>

      {/* Configuration options */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Budget Settings
          </h3>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Warning Threshold ($)</label>
            <input
              type="number"
              value={budgetLimit * 0.8}
              disabled
              className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-1.5 text-xs text-zinc-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Hard Loop Interruption Limit ($)</label>
            <input
              type="number"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4 p-3 rounded bg-amber-500/10 border border-amber-500/20 flex gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-amber-300 leading-relaxed">
            Routine summaries are automatically routed to cheap Gemini Flash endpoint to limit API leakage.
          </p>
        </div>
      </div>
    </div>
  );
}
