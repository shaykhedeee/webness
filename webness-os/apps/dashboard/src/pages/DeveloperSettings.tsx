import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  Key,
  ShieldAlert,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  CheckCircle,
  Clock,
  Code,
  Lock,
} from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function DeveloperSettings() {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [scopes, setScopes] = useState({
    toolsExecute: true,
    tasksRead: true,
    creditsRead: true,
  });

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Fetch organization programmatic keys
  const { data: keysQuery, isLoading } = useQuery({
    queryKey: ["clientApiKeys"],
    queryFn: () => api.get("/client-api-keys").then((r) => r.data),
  });

  const keys: ApiKey[] = keysQuery?.data || [];

  // Generate key mutation
  const generateMutation = useMutation({
    mutationFn: () => {
      const permissions = [];
      if (scopes.toolsExecute) permissions.push("tools.execute");
      if (scopes.tasksRead) permissions.push("tasks.read");
      if (scopes.creditsRead) permissions.push("credits.read");

      return api
        .post("/client-api-keys", {
          name: newKeyName,
          permissions,
        })
        .then((r) => r.data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["clientApiKeys"] });
      setGeneratedKey(res.data.cleartextKey);
      setShowKeyModal(true);
      setNewKeyName("");
      setScopes({ toolsExecute: true, tasksRead: true, creditsRead: true });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to generate key.");
    },
  });

  // Revoke key mutation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/client-api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientApiKeys"] });
      alert("Programmatic API Key successfully revoked.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to revoke key.");
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    generateMutation.mutate();
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      alert("API Key copied to clipboard!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
                Sovereign API Hub
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Programmatic Developer Credentials</h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Integrate Webness OS deep researcher, blog writer pipelines, and SEO crawlers into your own internal CRMs and business systems using standard REST headers.
            </p>
          </div>
          <Code className="h-16 w-16 text-indigo-400/30 hidden md:block" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Create Key form */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
            <h2 className="text-sm font-semibold mb-4 text-zinc-300 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-indigo-400" /> Provision API Key
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Key Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. CRM Sync Tool"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-indigo-500/60"
                  required
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Key Permissions Scopes</label>
                
                <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.toolsExecute}
                    onChange={(e) => setScopes({ ...scopes, toolsExecute: e.target.checked })}
                    className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>tools.execute (Trigger Agents)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.tasksRead}
                    onChange={(e) => setScopes({ ...scopes, tasksRead: e.target.checked })}
                    className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>tasks.read (Read status)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.creditsRead}
                    onChange={(e) => setScopes({ ...scopes, creditsRead: e.target.checked })}
                    className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>credits.read (Check wallet)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending || !newKeyName.trim()}
                className="w-full mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Generate Secret Key"
                )}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5">
            <h3 className="text-xs font-bold text-zinc-400 mb-2.5 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Header Reference
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              When querying endpoints via curl, attach the token as an authorization header:
            </p>
            <pre className="mt-2 rounded-lg bg-zinc-950 p-2 font-mono text-[9px] text-indigo-300 leading-relaxed overflow-x-auto border border-zinc-850">
              {`Authorization: Bearer wn_live_...`}
            </pre>
          </div>
        </div>

        {/* Right Side: Keys List */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
            <h2 className="text-sm font-semibold mb-4 text-zinc-300 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-indigo-400" /> Key Registrations
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-zinc-850 bg-zinc-950/20">
                <Lock className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No developer API keys active.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Configure the form on the left to spawn credentials.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 hover:border-zinc-800 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-xs text-zinc-200">{key.name}</span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            key.isActive ? "bg-emerald-500" : "bg-zinc-600"
                          }`}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500">
                        <code className="bg-zinc-900 text-indigo-300 px-1.5 py-0.5 rounded border border-zinc-850">
                          {key.keyPrefix}••••••••
                        </code>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(key.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {key.permissions.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-full bg-zinc-900 border border-zinc-850 px-2 py-0.5 text-[8px] font-medium text-zinc-400"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Revoke the key "${key.name}" permanently?`)) {
                          revokeMutation.mutate(key.id);
                        }
                      }}
                      className="rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 p-2.5 text-red-400 transition self-start sm:self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECURE KEY DISPLAY DIALOG */}
      {showKeyModal && generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-850 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100">API Key Successfully Spawned</h2>
              <p className="text-xs text-zinc-400 mt-1">
                This secret token grants programmatic access. For security, we only display it **once**.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-zinc-950 p-4 border border-zinc-850">
              <code className="flex-1 font-mono text-xs text-emerald-300 break-all select-all">
                {generatedKey}
              </code>
              <button
                onClick={handleCopy}
                className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 hover:text-zinc-200 transition"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-400 leading-relaxed flex gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div>
                <strong>Warning:</strong> You will not be able to retrieve or see this cleartext key again. Store it securely inside your password manager or environmental configs now.
              </div>
            </div>

            <button
              onClick={() => {
                setShowKeyModal(false);
                setGeneratedKey(null);
              }}
              className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 py-3 text-xs font-semibold text-zinc-300 transition"
            >
              I Have Saved My Secret Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
