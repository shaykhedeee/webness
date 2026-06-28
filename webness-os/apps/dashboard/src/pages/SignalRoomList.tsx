import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Globe, 
  Award, 
  Clock, 
  X, 
  ChevronRight, 
  ShieldAlert 
} from "lucide-react";

type ClientRoom = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  reportCadence: string;
  isActive: boolean;
  createdAt: string;
};

export default function SignalRoomList() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [goalsText, setGoalsText] = useState("");
  const [reportCadence, setReportCadence] = useState("weekly");
  const [toneText, setToneText] = useState("");

  const { data: clientsQuery, isLoading, error } = useQuery<{ data: ClientRoom[] }>({
    queryKey: ["clientRooms"],
    queryFn: () => api.get("/signal-room/clients").then((r) => r.data),
  });

  const clients = clientsQuery?.data || [];

  const addMutation = useMutation({
    mutationFn: (newClient: {
      name: string;
      website?: string;
      industry?: string;
      reportCadence: string;
      goals?: { primary: string };
      brandTone?: { style: string };
    }) => api.post("/signal-room/clients", newClient).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientRooms"] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to create client room.");
    }
  });

  const resetForm = () => {
    setName("");
    setWebsite("");
    setIndustry("");
    setGoalsText("");
    setReportCadence("weekly");
    setToneText("");
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addMutation.mutate({
      name,
      website: website || undefined,
      industry: industry || undefined,
      reportCadence,
      goals: goalsText ? { primary: goalsText } : undefined,
      brandTone: toneText ? { style: toneText } : undefined,
    });
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-zinc-100 to-purple-400 bg-clip-text text-transparent">
            Webness Signal Rooms
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor client signals, generate weekly narrative reports, and direct priority tasks.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-md shadow-indigo-600/10 hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4" /> Create Signal Room
        </button>
      </div>

      {/* Filter/Search Bar */}
      <div className="flex items-center max-w-md gap-3 rounded-xl border border-zinc-800 bg-zinc-900/20 px-3.5 py-2">
        <Search className="h-4 w-4 text-zinc-500" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          placeholder="Filter rooms by name or industry..."
        />
      </div>

      {/* Main content grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-red-200">Error Loading Client Rooms</h3>
          <p className="text-sm text-red-400/80 mt-1">Make sure backend database is running and credentials match.</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-16 text-center bg-zinc-900/10">
          <FolderKanban className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-300">No active Signal Rooms</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-2 leading-relaxed">
            Create a client room to begin ingesting performance signals and generating client-ready updates.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700 transition"
          >
            <Plus className="h-3.5 w-3.5" /> New Room
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              to={`/signal-room/${client.id}`}
              className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md hover:border-indigo-500/30 transition group flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-indigo-500/5 blur-[30px] group-hover:bg-indigo-500/10 transition-colors" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 border border-zinc-700/50">
                    {client.industry || "General Niche"}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {client.name}
                </h3>

                <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-zinc-600" />
                  {client.website ? (
                    <span className="truncate hover:underline">{client.website}</span>
                  ) : (
                    "No website linked"
                  )}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-400/80" />
                  {client.reportCadence} updates
                </span>
                <span className="inline-flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors font-medium">
                  Open Room <ChevronRight className="h-4 w-4 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Client Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/5 blur-[40px]" />
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Create New Client Room
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-850 hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Client Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Dr. Jane Dental Clinic"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                    placeholder="https://clientwebsite.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Industry / Niche
                  </label>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                    placeholder="e.g. healthcare, interior"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Report Cadence
                  </label>
                  <select
                    value={reportCadence}
                    onChange={(e) => setReportCadence(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Primary Goal
                  </label>
                  <input
                    value={goalsText}
                    onChange={(e) => setGoalsText(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50"
                    placeholder="e.g. increase organic leads by 20%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Brand Voice Directives
                </label>
                <textarea
                  value={toneText}
                  onChange={(e) => setToneText(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 p-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 h-20 resize-none"
                  placeholder="e.g. professional, empathetic, focused on data details"
                />
              </div>

              <div className="flex gap-2 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200 hover:bg-zinc-900/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {addMutation.isPending ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
