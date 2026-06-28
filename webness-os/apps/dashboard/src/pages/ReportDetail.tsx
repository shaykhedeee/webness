import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  FileText, 
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

type ReportData = {
  id: string;
  status: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  clientRoomId: string;
  narrative: {
    headline: string;
    executiveSummary: string;
    wins: string[];
    concerns: string[];
    workCompleted: string[];
    recommendedActions: Array<{
      title: string;
      description: string;
      impact: string;
      effort: string;
    }>;
    clientDecisionsNeeded: string[];
    sourceConfidence: string;
    missingData: string[];
  };
  clientRoom: {
    name: string;
    website: string | null;
    industry: string | null;
  };
  actionItems: Array<{
    id: string;
    title: string;
    description: string | null;
    impact: string | null;
    effort: string | null;
    status: string;
  }>;
};

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: reportQuery, isLoading, error } = useQuery<{ data: ReportData }>({
    queryKey: ["reportDetail", id],
    queryFn: () => api.get(`/signal-room/reports/${id}`).then((r) => r.data),
  });

  const report = reportQuery?.data;

  // Approve report mutation
  const approveMutation = useMutation({
    mutationFn: () => api.post(`/signal-room/reports/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["clientRoomDetail"] });
      alert("Report approved! Action items have been promoted to the Client Room task list.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Approval failed.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-red-200">Report Not Found</h3>
        <p className="text-sm text-red-400/80 mt-1">This report draft does not exist or has been deleted.</p>
        <Link to="/signal-room" className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to Signal Rooms
        </Link>
      </div>
    );
  }

  const narrative = report.narrative;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to={`/signal-room/${report.clientRoomId || ""}`} 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Client Room
        </Link>

        {report.status === "APPROVED" && (
          <a
            href={`/api/signal-room/reports/${report.id}/share`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-semibold text-zinc-400 hover:border-zinc-700 transition hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View Public Share Link
          </a>
        )}
      </div>

      {/* Main Status Bar */}
      <div className={`rounded-2xl border p-5 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        report.status === "APPROVED" 
          ? "border-emerald-500/20 bg-emerald-500/5" 
          : "border-amber-500/20 bg-amber-500/5"
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
              report.status === "APPROVED" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
            }`}>
              {report.status}
            </span>
            <span className="text-xs text-zinc-400">
              Coverage: {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{report.title}</h2>
          <p className="text-xs text-zinc-500 mt-1">Client: <strong className="text-zinc-300">{report.clientRoom?.name}</strong></p>
        </div>

        {report.status === "DRAFT" && (
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-md shadow-indigo-600/10 hover:scale-[1.01]"
          >
            <CheckCircle className="h-4.5 w-4.5" /> {approveMutation.isPending ? "Approving..." : "Approve and Promote Tasks"}
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Narrative Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md space-y-6">
            
            {/* Headline */}
            <div className="border-l-4 border-indigo-500 pl-4 py-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Executive Summary Headline</h3>
              <p className="text-lg font-bold text-zinc-100">{narrative.headline || "Weekly update outline"}</p>
            </div>

            {/* Executive summary details */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Summary</h4>
              <p className="text-sm leading-7 text-zinc-300 whitespace-pre-wrap">{narrative.executiveSummary}</p>
            </div>

            {/* Wins vs concerns */}
            <div className="grid gap-6 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" /> Performance Wins
                </h4>
                {narrative.wins?.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                    {narrative.wins.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-500">No major wins identified.</p>
                )}
              </div>

              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Key Concerns
                </h4>
                {narrative.concerns?.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                    {narrative.concerns.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-500">No major concerns noticed.</p>
                )}
              </div>
            </div>

            {/* Work Completed */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Work Completed</h4>
              {narrative.workCompleted?.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-zinc-300 space-y-2 leading-relaxed">
                  {narrative.workCompleted.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 italic">No checklist work reported.</p>
              )}
            </div>

            {/* Client Decisions Needed */}
            {narrative.clientDecisionsNeeded?.length > 0 && (
              <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" /> Client Feedback Needed
                </h4>
                <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                  {narrative.clientDecisionsNeeded.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Proposed Action Items */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 backdrop-blur-md space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-2 flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-indigo-400" /> Proposed Action Items
            </h3>

            <div className="space-y-4">
              {report.actionItems && report.actionItems.length > 0 ? (
                report.actionItems.map((act) => (
                  <div key={act.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-2 relative">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-zinc-200">{act.title}</h4>
                      <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-bold border ${
                        act.status === "APPROVED" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        {act.status}
                      </span>
                    </div>

                    {act.description && (
                      <p className="text-xs text-zinc-500 leading-normal">{act.description}</p>
                    )}

                    <div className="flex gap-1.5 pt-1">
                      <span className="rounded-full px-2 py-0.5 text-[9px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                        Impact: {act.impact}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[9px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                        Effort: {act.effort}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                narrative.recommendedActions?.map((act, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-2">
                    <h4 className="font-bold text-sm text-zinc-200">{act.title}</h4>
                    <p className="text-xs text-zinc-500 leading-normal">{act.description}</p>
                    <div className="flex gap-1.5 pt-1">
                      <span className="rounded-full px-2 py-0.5 text-[9px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                        Impact: {act.impact}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[9px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                        Effort: {act.effort}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quality Moat Details */}
            <div className="pt-4 border-t border-zinc-850 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Source Confidence</span>
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400 font-bold border border-indigo-500/20 inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> {narrative.sourceConfidence || "medium"}
                </span>
              </div>

              {narrative.missingData?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Missing Parameters</span>
                  <ul className="list-disc list-inside text-[10px] text-zinc-400 leading-relaxed">
                    {narrative.missingData.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
