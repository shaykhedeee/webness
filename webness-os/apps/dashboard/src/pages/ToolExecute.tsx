import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../lib/api.js";
import { useSSE } from "../hooks/useSSE.js";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Brain,
  Wrench,
  FileText,
} from "lucide-react";

const stepIcons: Record<string, any> = {
  THINKING: Brain,
  TOOL_CALL: Wrench,
  RESULT: FileText,
  ERROR: XCircle,
};

export default function ToolExecute() {
  const { slug } = useParams();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Fetch tool schema
  const { data: toolData } = useQuery({
    queryKey: ["tool-schema", slug],
    queryFn: () => api.get(`/tools/${slug}/schema`).then((r) => r.data),
  });

  // SSE connection for live updates
  const { events, isConnected } = useSSE(taskId);

  // Execute tool
  const execute = useMutation({
    mutationFn: () =>
      api.post(`/tools/${slug}/execute`, { input: formData }).then((r) => r.data),
    onSuccess: (data) => {
      setTaskId(data.data.taskId);
    },
  });

  const tool = toolData?.data;
  const schema = tool?.inputSchema?.properties || {};
  const isComplete = events.some(
    (e) => e.event === "task:completed" || e.event === "task:failed"
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">{tool?.name || slug}</h1>
      <p className="mb-8 text-zinc-500">{tool?.description}</p>

      {/* ─── Input Form ───────────────────────────────────── */}
      {!taskId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            execute.mutate();
          }}
          className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
        >
          {Object.entries(schema).map(([key, config]: [string, any]) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium capitalize">
                {key.replace(/_/g, " ")}
              </label>
              {config.type === "string" && config.maxLength > 500 ? (
                <textarea
                  value={formData[key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                  placeholder={config.description || ""}
                  required={tool?.inputSchema?.required?.includes(key)}
                />
              ) : (
                <input
                  type="text"
                  value={formData[key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                  placeholder={config.description || ""}
                  required={tool?.inputSchema?.required?.includes(key)}
                />
              )}
              {config.description && (
                <p className="mt-1 text-xs text-zinc-500">
                  {config.description}
                </p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={execute.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {execute.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Execute ({tool?.creditCost} credits)
          </button>
        </form>
      )}

      {/* ─── Live Progress (Glass Factory) ────────────────── */}
      {taskId && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            {isConnected && !isComplete && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            )}
            <span className="text-sm text-zinc-400">
              {isComplete ? "Complete" : "Processing..."}
            </span>
          </div>

          <div className="space-y-3">
            {events
              .filter((e) => e.event.startsWith("step:created"))
              .map((e, i) => {
                const Icon = stepIcons[e.data.action] || FileText;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 animate-slide-in"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                      <Icon className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm">{e.data.description}</p>
                      <p className="text-xs text-zinc-600">
                        {e.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}

            {/* Final result */}
            {events
              .filter((e) => e.event === "task:completed")
              .map((e, i) => (
                <div
                  key={`result-${i}`}
                  className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 animate-slide-in"
                >
                  <div className="mb-2 flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Task Complete</span>
                  </div>
                  <pre className="overflow-auto text-xs text-zinc-300">
                    {JSON.stringify(e.data.result, null, 2)}
                  </pre>
                </div>
              ))}

            {/* Error */}
            {events
              .filter((e) => e.event === "task:failed")
              .map((e, i) => (
                <div
                  key={`error-${i}`}
                  className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4 animate-slide-in"
                >
                  <div className="mb-2 flex items-center gap-2 text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Task Failed</span>
                  </div>
                  <p className="text-sm text-red-300">{e.data.error}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
