import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { 
  ArrowLeft, 
  Upload, 
  HelpCircle, 
  TrendingUp, 
  Activity,
  FileText
} from "lucide-react";

export default function SignalIntake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState("manual");
  const [title, setTitle] = useState("Weekly Progress Signal");
  
  // Qualitative notes
  const [workCompleted, setWorkCompleted] = useState("");
  const [blockers, setBlockers] = useState("");
  const [wins, setWins] = useState("");

  // Quantitative numbers
  const [gscClicks, setGscClicks] = useState("");
  const [gscImpressions, setGscImpressions] = useState("");
  const [ga4Sessions, setGa4Sessions] = useState("");
  const [pageSpeedScore, setPageSpeedScore] = useState("");
  const [conversions, setConversions] = useState("");

  // Dates
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const { data: clientQuery } = useQuery({
    queryKey: ["clientRoomDetail", id],
    queryFn: () => api.get(`/signal-room/clients/${id}`).then((r) => r.data),
  });

  const clientName = clientQuery?.data?.name || "Client Room";

  const addSignalMutation = useMutation({
    mutationFn: (signalData: {
      source: string;
      title: string;
      value: any;
      periodStart?: string;
      periodEnd?: string;
    }) => api.post(`/signal-room/clients/${id}/signals`, signalData).then((r) => r.data),
    onSuccess: () => {
      navigate(`/signal-room/${id}`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to ingest signal.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Assemble value payload
    const valuePayload: Record<string, any> = {
      workCompleted: workCompleted.split("\n").filter(line => line.trim()),
      blockers: blockers.split("\n").filter(line => line.trim()),
      wins: wins.split("\n").filter(line => line.trim()),
      metrics: {
        gscClicks: gscClicks ? parseInt(gscClicks, 10) : null,
        gscImpressions: gscImpressions ? parseInt(gscImpressions, 10) : null,
        ga4Sessions: ga4Sessions ? parseInt(ga4Sessions, 10) : null,
        pageSpeedScore: pageSpeedScore ? parseInt(pageSpeedScore, 10) : null,
        conversions: conversions ? parseInt(conversions, 10) : null,
      }
    };

    addSignalMutation.mutate({
      source,
      title,
      value: valuePayload,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back link */}
      <div>
        <Link 
          to={`/signal-room/${id}`} 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Client Room
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Ingest Performance Signal
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Add weekly data points, ad metrics, GA4 sessions, or task completion logs for <strong className="text-zinc-200">{clientName}</strong>.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" /> Basic Information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Signal Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
              >
                <option value="manual">Manual Progress Log</option>
                <option value="gsc">Google Search Console</option>
                <option value="ga4">Google Analytics (GA4)</option>
                <option value="pagespeed">Google PageSpeed Insights</option>
                <option value="outreach">Email Outreach Tracker</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Signal Title
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                placeholder="e.g. Weekly Work & Traffic Update"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Period Start (Optional)
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Period End (Optional)
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Qualitative Section */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" /> Qualitative Work Progress
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Work Completed This Week (One item per line)
            </label>
            <textarea
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 h-24 font-sans"
              placeholder="e.g. Optimized landing page title tag&#10;Published two blog posts on ancestral health&#10;Fixed mobile checkout button alignment"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Wins & Highlights (One per line)
              </label>
              <textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 h-20"
                placeholder="e.g. Page speed score increased to 92&#10;organic leads increased by 15% this week"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Blockers & Risks (One per line)
              </label>
              <textarea
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 h-20"
                placeholder="e.g. Waiting on client logo source assets&#10;Server downtime noticed on Tuesday morning"
              />
            </div>
          </div>
        </div>

        {/* Quantitative Section */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" /> Quantitative Performance Metrics
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Google Search Clicks
              </label>
              <input
                type="number"
                value={gscClicks}
                onChange={(e) => setGscClicks(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                placeholder="e.g. 150"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                GSC Impressions
              </label>
              <input
                type="number"
                value={gscImpressions}
                onChange={(e) => setGscImpressions(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                placeholder="e.g. 12000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                GA4 Sessions
              </label>
              <input
                type="number"
                value={ga4Sessions}
                onChange={(e) => setGa4Sessions(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                placeholder="e.g. 450"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                PageSpeed Score (1-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={pageSpeedScore}
                onChange={(e) => setPageSpeedScore(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                placeholder="e.g. 95"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Leads / Conversions
              </label>
              <input
                type="number"
                value={conversions}
                onChange={(e) => setConversions(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                placeholder="e.g. 24"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Link
            to={`/signal-room/${id}`}
            className="rounded-lg border border-zinc-850 px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200 hover:bg-zinc-900/50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={addSignalMutation.isPending}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {addSignalMutation.isPending ? "Ingesting..." : "Ingest Signal"}
          </button>
        </div>
      </form>
    </div>
  );
}
