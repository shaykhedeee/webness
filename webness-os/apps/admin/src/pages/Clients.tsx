import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import { Users, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clients", search, plan],
    queryFn: () =>
      api
        .get("/admin/clients", { params: { search, plan: plan || undefined } })
        .then((r) => r.data),
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Clients</h1>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm outline-none focus:border-red-500"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm outline-none"
        >
          <option value="">All plans</option>
          <option value="FREE">Free</option>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="AGENCY">Agency</option>
          <option value="SAASS">SaaS-S</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : data?.data?.length ? (
          data.data.map((client: any) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-zinc-500">
                    {client.userCount} users · {client.taskCount} tasks ·{" "}
                    {client.creditBalance} credits
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {client.plan}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    client.isActive ? "bg-emerald-500" : "bg-zinc-600"
                  }`}
                />
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </div>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center text-sm text-zinc-500">
            No clients found
          </div>
        )}
      </div>
    </div>
  );
}
