import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  ListTodo,
  RefreshCw,
  Play,
  XCircle,
  Clock,
  Search,
  CheckCircle,
  AlertCircle,
  User,
  Zap,
} from "lucide-react";

type TaskStep = {
  id: string;
  action: string;
  description: string | null;
  status: string;
};

type Task = {
  id: string;
  status: string;
  priority: number;
  inputData: any;
  outputData: any;
  creditCost: number;
  error: string | null;
  createdAt: string;
  tool: { name: string; slug: string };
  org: { name: string; slug: string };
  user: { name: string; email: string };
  steps?: TaskStep[];
};

export default function TaskQueue() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch tasks
  const { data: tasksQuery, isLoading, refetch } = useQuery({
    queryKey: ["adminTasks", statusFilter],
    queryFn: () =>
      api
        .get("/admin/tasks", { params: { status: statusFilter || undefined, limit: 30 } })
        .then((r) => r.data),
    refetchInterval: 10000,
  });

  const tasks: Task[] = tasksQuery?.data || [];

  // Retry failed task mutation
  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tasks/${id}/retry`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTasks"] });
      alert("Failed job successfully enqueued back to BullMQ.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to retry task.");
    },
  });

  // Cancel task mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tasks/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTasks"] });
      alert("Pipeline job canceled successfully.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to cancel task.");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-indigo-400" /> BullMQ Execution Monitor
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Supervise all active pipeline executions, retry failed content generators, or prune runaway queues.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-zinc-400 hover:text-zinc-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Status filter bar */}
      <div className="flex justify-between items-center gap-4 bg-zinc-900/20 p-3 border border-zinc-850 rounded-xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pipeline State</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs outline-none text-zinc-300 focus:border-indigo-500"
        >
          <option value="">All active queues</option>
          <option value="QUEUED">Queued / Waiting</option>
          <option value="PROCESSING">Processing / GPU Node</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Side: Tasks Table */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20">
              <ListTodo className="h-10 w-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No matching pipelines found in queue.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row justify-between gap-4 ${
                    selectedTask?.id === task.id
                      ? "border-indigo-500/40 bg-indigo-500/5"
                      : "border-zinc-850 bg-zinc-950/40 hover:border-zinc-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-xs text-zinc-200">{task.tool.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({task.org.name})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {task.user.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(task.createdAt).toLocaleTimeString()}
                      </span>
                      <span>•</span>
                      <span className="text-indigo-400 font-semibold">{task.creditCost} Cr</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                        task.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : task.status === "FAILED"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                      }`}
                    >
                      {task.status}
                    </span>

                    {task.status === "FAILED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retryMutation.mutate(task.id);
                        }}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 p-1.5 text-zinc-400 transition"
                        title="Retry Failed Task"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {(task.status === "QUEUED" || task.status === "PROCESSING") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Cancel this running pipeline?")) {
                            cancelMutation.mutate(task.id);
                          }
                        }}
                        className="rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 p-1.5 text-red-400 transition"
                        title="Cancel Task"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Task detail panel */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md flex flex-col">
          {selectedTask ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">Task Details</h2>
                <code className="text-[10px] text-zinc-500 font-mono block truncate">{selectedTask.id}</code>
              </div>

              <div className="space-y-2 text-xs border-y border-zinc-850 py-3">
                <p className="flex justify-between">
                  <span className="text-zinc-500">Pipeline Module:</span>
                  <span className="text-zinc-300 font-medium">{selectedTask.tool.name} ({selectedTask.tool.slug})</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-zinc-500">Authorized Org:</span>
                  <span className="text-zinc-300 font-medium">{selectedTask.org.name}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-zinc-500">Billing Credits:</span>
                  <span className="text-indigo-400 font-semibold">{selectedTask.creditCost} Credits</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-zinc-500">Completed At:</span>
                  <span className="text-zinc-400">{new Date(selectedTask.createdAt).toLocaleString()}</span>
                </p>
              </div>

              {/* Error block if failed */}
              {selectedTask.error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 leading-normal flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-0.5">Execution Error Log</strong>
                    {selectedTask.error}
                  </div>
                </div>
              )}

              {/* Task payload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Input Parameter Payload</label>
                <pre className="rounded-xl bg-zinc-950 p-3 font-mono text-[9px] text-zinc-400 max-h-[140px] overflow-auto border border-zinc-850">
                  {JSON.stringify(selectedTask.inputData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-20">
              <Zap className="h-8 w-8 text-zinc-800 animate-pulse mb-1" />
              <p className="text-xs">Select an enqueued pipeline on the left to examine logs and task steps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
