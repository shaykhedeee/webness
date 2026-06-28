import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  FileText,
  RefreshCw,
  Clock,
  User,
  Search,
  Shield,
  Activity,
  Globe,
  Terminal,
} from "lucide-react";

type AuditEntry = {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  } | null;
};

export default function AuditLog() {
  const [searchAction, setSearchAction] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  // Fetch audit logs
  const { data: logsQuery, isLoading, refetch } = useQuery({
    queryKey: ["adminAuditLogs", searchAction, resourceFilter],
    queryFn: () =>
      api
        .get("/admin/audit-log", {
          params: {
            action: searchAction || undefined,
            resource: resourceFilter || undefined,
            limit: 30,
          },
        })
        .then((r) => r.data),
  });

  const logs: AuditEntry[] = logsQuery?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-400" /> Security Audit Log
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            God-mode security ledger. Audit every administrative credit allowance, plan update, model swap, and API handshake.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-zinc-400 hover:text-zinc-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filter panel */}
      <div className="grid gap-3 sm:grid-cols-2 bg-zinc-900/20 p-4 border border-zinc-850 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            placeholder="Search action keyword... (e.g. adjust)"
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-xs outline-none text-zinc-300 focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs outline-none text-zinc-400 focus:border-indigo-500"
          >
            <option value="">All target resources</option>
            <option value="organization">organization</option>
            <option value="invoice">invoice</option>
            <option value="task">task</option>
            <option value="api_key">api_key</option>
            <option value="brain">brain</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20">
            <p className="text-xs text-zinc-500">No security audit entries found in period.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 hover:border-zinc-800 transition flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-300">
                      {entry.action.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">on {entry.resource}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />{" "}
                      {entry.user?.name || entry.actorId || entry.actorType.toUpperCase()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(entry.createdAt).toLocaleString()}
                    </span>
                    {entry.ipAddress && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {entry.ipAddress}
                        </span>
                      </>
                    )}
                  </div>

                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-2.5">
                      <pre className="rounded-lg bg-zinc-950 p-2 font-mono text-[9px] text-zinc-500 max-h-[80px] overflow-auto border border-zinc-900/50">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex items-center self-start sm:self-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold flex items-center gap-1 border ${
                      entry.actorType === "admin" || entry.actorType === "user"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        : entry.actorType === "ai_brain"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`}
                  >
                    {entry.actorType === "ai_brain" ? (
                      <>
                        <Terminal className="h-2.5 w-2.5" /> AI BRAIN
                      </>
                    ) : (
                      <>
                        <Shield className="h-2.5 w-2.5" /> {entry.actorType.toUpperCase()}
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
