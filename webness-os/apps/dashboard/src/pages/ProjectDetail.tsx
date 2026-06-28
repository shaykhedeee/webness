import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "../lib/api.js";
import { timeAgo } from "../lib/utils.js";
import {
  CheckCircle2,
  XCircle,
  Brain,
  Wrench,
  FileText,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

const stepIcons: Record<string, any> = {
  THINKING: Brain,
  TOOL_CALL: Wrench,
  RESULT: FileText,
  ERROR: XCircle,
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const project = data?.data;
  if (!project) return <p>Project not found</p>;

  const handleHitlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/projects/${id}/respond`, { answers });
      refetch();
    } catch (err) {
      console.error("Failed to submit responses", err);
      alert("Error submitting feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/projects"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Projects
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {project.tool?.name ?? "Task"}
          </h1>
          <p className="text-sm text-zinc-500">{timeAgo(project.createdAt)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            project.status === "COMPLETED"
              ? "bg-emerald-500/10 text-emerald-400"
              : project.status === "FAILED"
                ? "bg-red-500/10 text-red-400"
                : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {project.status}
        </span>
      </div>

      {/* ─── HITL Questions Container ────────────────── */}
      {project.status === "WAITING_INPUT" && project.outputData?.questions && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 backdrop-blur-md">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-amber-400">
            <Brain className="h-5 w-5 animate-pulse" /> Action Needed: Agent Decision Checkpoint
          </h2>
          <p className="mb-4 text-sm text-zinc-400">
            The AI agent is ready to proceed but requires your validation for this high-stakes task step:
          </p>

          <form onSubmit={handleHitlSubmit} className="space-y-4">
            {project.outputData.questions.map((q: any) => (
              <div key={q.id} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">{q.text}</label>
                {q.type === "boolean" ? (
                  <select
                    value={answers[q.id] ?? "false"}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : q.type === "number" ? (
                  <input
                    type="number"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter number..."
                  />
                ) : (
                  <textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Provide detailed feedback..."
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting and re-queueing task..." : "Confirm & Resume Execution"}
            </button>
          </form>
        </div>
      )}

      {/* ─── Input ─────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-400">Input</h2>
        <pre className="overflow-auto text-xs text-zinc-300">
          {JSON.stringify(project.inputData || project.input, null, 2)}
        </pre>
      </div>

      {/* ─── Steps Timeline ────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-400">Steps</h2>

        <div className="space-y-4">
          {project.steps?.map((step: any, i: number) => {
            const Icon = stepIcons[step.action] || Clock;
            const isLast = i === project.steps.length - 1;
            return (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step.status === "COMPLETED"
                        ? "bg-emerald-500/10"
                        : step.status === "FAILED"
                          ? "bg-red-500/10"
                          : "bg-zinc-800"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        step.status === "COMPLETED"
                          ? "text-emerald-400"
                          : step.status === "FAILED"
                            ? "text-red-400"
                            : "text-zinc-400"
                      }`}
                    />
                  </div>
                  {!isLast && (
                    <div className="mt-1 h-full w-px bg-zinc-800" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{step.description}</p>
                  <p className="text-xs text-zinc-500">
                    {step.agent?.name && `${step.agent.name} · `}
                    {timeAgo(step.createdAt)}
                  </p>
                  {(step.outputData || step.result) && step.action === "RESULT" && (
                    <pre className="mt-2 overflow-auto rounded-lg bg-zinc-800 p-3 text-xs text-zinc-300">
                      {JSON.stringify(step.outputData || step.result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
