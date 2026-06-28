import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { 
  Globe, 
  ArrowLeft, 
  Plus, 
  FileText, 
  Activity, 
  CheckSquare, 
  Clock, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Inbox,
  AlertCircle
} from "lucide-react";

type ClientRoom = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  goals: any;
  reportCadence: string;
  brandTone: any;
  signals: Array<{
    id: string;
    source: string;
    title: string;
    value: any;
    createdAt: string;
  }>;
  reports: Array<{
    id: string;
    status: string;
    title: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  }>;
  actionItems: Array<{
    id: string;
    title: string;
    description: string | null;
    impact: string | null;
    effort: string | null;
    status: string;
    createdAt: string;
  }>;
};

export default function SignalRoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"actions" | "reports" | "signals">("actions");
  const [reportTitle, setReportTitle] = useState("Weekly Performance Update");
  
  // Date range for report generation
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: clientQuery, isLoading, error } = useQuery<{ data: ClientRoom }>({
    queryKey: ["clientRoomDetail", id],
    queryFn: () => api.get(`/signal-room/clients/${id}`).then((r) => r.data),
  });

  const client = clientQuery?.data;

  // AI report generation mutation
  const generateMutation = useMutation({
    mutationFn: (args: { title: string; periodStart: string; periodEnd: string }) =>
      api.post(`/signal-room/clients/${id}/reports/generate`, args).then((r) => r.data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["clientRoomDetail", id] });
      // Redirect straight to report detail page to review/approve
      if (res.data?.id) {
        navigate(`/signal-room/reports/${res.data.id}`);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "AI report generation failed.");
    }
  });

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      title: reportTitle,
      periodStart: new Date(startDate).toISOString(),
      periodEnd: new Date(endDate).toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-red-200">Client Room Not Found</h3>
        <p className="text-sm text-red-400/80 mt-1">This room may have been deleted or does not exist.</p>
        <Link to="/signal-room" className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to Signal Rooms
        </Link>
      </div>
    );
  }

  // Group action items by status
  const pendingActions = client.actionItems.filter(act => act.status === "PROPOSED");
  const activeActions = client.actionItems.filter(act => act.status === "APPROVED" || act.status === "IN_PROGRESS");
  const completedActions = client.actionItems.filter(act => act.status === "COMPLETED");

  return (
    <div className="space-y-8">
      {/* Back to list */}
      <div>
        <Link 
          to="/signal-room" 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Signal Rooms
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/5 blur-[40px]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-400 border border-indigo-500/20">
                {client.industry || "General Niche"}
              </span>
              <span className="text-xs text-zinc-500">• {client.reportCadence} cadence</span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{client.name}</h1>
            
            {client.website && (
              <a 
                href={client.website} 
                target="_blank" 
                rel="noreferrer" 
                className="mt-2 text-sm text-zinc-400 hover:text-indigo-400 transition inline-flex items-center gap-1.5"
              >
                <Globe className="h-4 w-4 text-zinc-500" />
                {client.website}
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              to={`/signal-room/${client.id}/intake`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-700 transition hover:text-white"
            >
              <Plus className="h-4 w-4" /> Ingest Signal
            </Link>
          </div>
        </div>

        {/* Goals block */}
        {client.goals && (client.goals as any).primary && (
          <div className="mt-6 pt-4 border-t border-zinc-850 flex items-start gap-2 text-xs text-zinc-400">
            <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-300">Primary Goal:</span>{" "}
              {(client.goals as any).primary}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 flex gap-6">
        <button
          onClick={() => setActiveTab("actions")}
          className={`pb-4 text-sm font-semibold border-b-2 transition ${
            activeTab === "actions"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          } flex items-center gap-2`}
        >
          <CheckSquare className="h-4 w-4" /> Action Board
          {activeActions.length > 0 && (
            <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.2 text-[10px] text-indigo-400 font-bold border border-indigo-500/20">
              {activeActions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-4 text-sm font-semibold border-b-2 transition ${
            activeTab === "reports"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          } flex items-center gap-2`}
        >
          <FileText className="h-4 w-4" /> Reports
          {client.reports.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400 font-bold border border-zinc-700">
              {client.reports.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("signals")}
          className={`pb-4 text-sm font-semibold border-b-2 transition ${
            activeTab === "signals"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          } flex items-center gap-2`}
        >
          <Activity className="h-4 w-4" /> Signals
          {client.signals.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400 font-bold border border-zinc-700">
              {client.signals.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "actions" && (
        <div className="space-y-6">
          {client.actionItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center text-zinc-500 bg-zinc-900/10">
              <CheckSquare className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <h4 className="font-semibold text-zinc-400">No active action items</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Generate an AI weekly report first. The system will auto-suggest action items for your review.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Active Tasks column */}
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-5 backdrop-blur-md flex flex-col h-[400px]">
                <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-3 flex items-center justify-between">
                  <span>Active Tasks</span>
                  <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400 font-bold">
                    {activeActions.length}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {activeActions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                      <Inbox className="h-8 w-8 mb-2" />
                      <p className="text-xs">No active tasks in progress.</p>
                    </div>
                  ) : (
                    activeActions.map(act => (
                      <div key={act.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 relative group">
                        <h4 className="font-bold text-sm text-zinc-200">{act.title}</h4>
                        {act.description && <p className="text-xs text-zinc-500 mt-1">{act.description}</p>}
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                            act.impact === "high"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : act.impact === "medium"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}>
                            Impact: {act.impact}
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold">
                            Effort: {act.effort}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Proposed (Waiting Review) Column */}
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-5 backdrop-blur-md flex flex-col h-[400px]">
                <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-3 flex items-center justify-between">
                  <span>Proposed in Draft Reports</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 font-bold">
                    {pendingActions.length}
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {pendingActions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                      <Inbox className="h-8 w-8 mb-2" />
                      <p className="text-xs">No proposed items awaiting review.</p>
                    </div>
                  ) : (
                    pendingActions.map(act => (
                      <div key={act.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                        <h4 className="font-bold text-sm text-zinc-300">{act.title}</h4>
                        {act.description && <p className="text-xs text-zinc-500 mt-1">{act.description}</p>}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-2">
                            <span className="rounded-full px-2 py-0.5 text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Impact: {act.impact}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Draft report
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* List of Reports */}
          <div className="md:col-span-2 space-y-4">
            {client.reports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center text-zinc-500 bg-zinc-900/10">
                <FileText className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <h4 className="font-semibold text-zinc-400">No reports generated</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Use the narrative generator on the right to compile your first client performance report.
                </p>
              </div>
            ) : (
              client.reports.map((rep) => (
                <Link
                  key={rep.id}
                  to={`/signal-room/reports/${rep.id}`}
                  className="block rounded-xl border border-zinc-850 bg-zinc-900/40 p-4 hover:border-indigo-500/20 hover:bg-zinc-900/60 transition group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                        {rep.title}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Coverage: {new Date(rep.periodStart).toLocaleDateString()} - {new Date(rep.periodEnd).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        rep.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                      }`}>
                        {rep.status}
                      </span>
                      <ChevronRight className="h-5 w-5 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* AI Narrative Report Builder Form */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 backdrop-blur-md relative overflow-hidden h-fit">
            <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" /> AI Narrative Generator
            </h3>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Report Title
                </label>
                <input
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid gap-2 grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="w-full mt-2 inline-flex justify-center items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {generateMutation.isPending ? "Generating..." : "Generate AI Draft"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "signals" && (
        <div className="space-y-4">
          {client.signals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-855 p-12 text-center text-zinc-500 bg-zinc-900/10">
              <Activity className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <h4 className="font-semibold text-zinc-400">No performance signals found</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Ingest manual work updates or metric snapshots to build context for the AI writer.
              </p>
              <Link
                to={`/signal-room/${client.id}/intake`}
                className="mt-4 inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-700 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Signal
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md">
              <table className="w-full border-collapse text-left text-sm text-zinc-300">
                <thead className="bg-zinc-900/60 border-b border-zinc-850 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Data Payload</th>
                    <th className="px-6 py-4 text-right">Ingested At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {client.signals.map((sig) => (
                    <tr key={sig.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-indigo-400">
                        {sig.source}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-200">
                        {sig.title}
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <pre className="text-[10px] font-mono bg-zinc-950/80 rounded p-2 text-zinc-400 max-h-16 overflow-y-auto">
                          {JSON.stringify(sig.value, null, 2)}
                        </pre>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-zinc-500">
                        {new Date(sig.createdAt).toLocaleDateString()} at {new Date(sig.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
