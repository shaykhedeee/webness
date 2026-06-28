import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  Users,
  ListTodo,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-health"],
    queryFn: () => api.get("/admin/system/health").then((r) => r.data),
    refetchInterval: 30000, // Refresh every 30s
  });

  const health = data?.data;

  const stats = [
    {
      label: "Organizations",
      value: health?.organizations?.total ?? "—",
      sub: `${health?.organizations?.active ?? 0} active`,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Total Users",
      value: health?.users?.total ?? "—",
      icon: CreditCard,
      color: "text-indigo-400",
    },
    {
      label: "Tasks Today",
      value: health?.tasks?.today ?? "—",
      sub: `${health?.tasks?.queued ?? 0} queued`,
      icon: ListTodo,
      color: "text-emerald-400",
    },
    {
      label: "Failed Tasks",
      value: health?.tasks?.failed ?? "—",
      icon: AlertTriangle,
      color: "text-red-400",
    },
  ];

  const services = [
    {
      name: "Database",
      status: health?.database?.connected ? "online" : "offline",
    },
    {
      name: "Redis",
      status: health?.redis?.connected ? "online" : "offline",
      detail: health?.redis?.memory,
    },
    {
      name: "AI Brain",
      status: health?.brain?.status ?? "unknown",
      detail: health?.brain?.models?.join(", "),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">System Overview</h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            {s.sub && <p className="text-xs text-zinc-500">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Service Status */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-400">
          Service Status
        </h2>
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {svc.status === "online" || svc.status === "healthy" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm font-medium">{svc.name}</span>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-medium ${
                    svc.status === "online" || svc.status === "healthy"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {svc.status}
                </span>
                {svc.detail && (
                  <p className="text-[10px] text-zinc-500">{svc.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
