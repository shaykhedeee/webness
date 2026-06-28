import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  Users,
  CreditCard,
  Settings,
  Plus,
  Minus,
  Save,
  Clock,
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

type ClientUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
};

type ClientTask = {
  id: string;
  status: string;
  createdAt: string;
  tool: { name: string };
};

type ApiKey = {
  id: string;
  name: string;
  createdAt: string;
};

type ClientOrg = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  domain: string | null;
  isActive: boolean;
  byokKeys: Record<string, string> | null;
  createdAt: string;
  users: ClientUser[];
  tasks: ClientTask[];
  creditWallet?: { balance: number };
  apiKeys?: ApiKey[];
};

export default function ClientDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Credit adjustment states
  const [creditAmount, setCreditAmount] = useState(100);
  const [creditReason, setCreditReason] = useState("");

  // Payment states
  const [paymentCash, setPaymentCash] = useState(1500);
  const [paymentCredits, setPaymentCredits] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");

  // Fetch client details
  const { data: clientQuery, isLoading, refetch } = useQuery({
    queryKey: ["adminClientDetail", id],
    queryFn: () => api.get(`/admin/clients/${id}`).then((r) => r.data),
  });

  const client: ClientOrg = clientQuery?.data;

  // Update client plan mutation
  const updateMutation = useMutation({
    mutationFn: (data: { plan?: string; isActive?: boolean }) =>
      api.patch(`/admin/clients/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClientDetail", id] });
      alert("Client configuration updated successfully.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to update client.");
    },
  });

  // Adjust credits mutation
  const adjustMutation = useMutation({
    mutationFn: (data: { orgId: string; amount: number; reason: string }) =>
      api.post("/admin/credits/adjust", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClientDetail", id] });
      alert("Credits adjusted successfully.");
      setCreditReason("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to adjust credits.");
    },
  });

  // Record manual payment mutation
  const paymentMutation = useMutation({
    mutationFn: (data: {
      orgId: string;
      amount: number;
      credits: number;
      method: string;
      reference: string;
      notes: string;
    }) => api.post("/admin/payments/manual", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClientDetail", id] });
      alert("UPI/Manual wire payment successfully logged, credits added.");
      setPaymentRef("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to log payment.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Client organization not found.</p>
        <Link to="/clients" className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-400">
          <ArrowLeft className="h-4 w-4" /> Back to clients
        </Link>
      </div>
    );
  }

  const byok = client.byokKeys || {};
  const hasByok = Object.values(byok).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
        <Link
          to="/clients"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">{client.name}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            God-mode client control. Provision plan changes, UPI B2B invoices, and custom credit allowances.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Side: Client profile & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Plan hot-swapper */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
            <h2 className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-4">
              <Settings className="h-4 w-4 text-indigo-400" /> Client Control Portal
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase font-semibold">Active Plan Tier</label>
                <select
                  value={client.plan}
                  onChange={(e) => updateMutation.mutate({ plan: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                >
                  <option value="FREE">FREE (Limited demo, 50 Cr)</option>
                  <option value="STARTER">STARTER ($49/mo, 500 Cr)</option>
                  <option value="PRO">PRO ($149/mo, 2000 Cr)</option>
                  <option value="ENTERPRISE">ENTERPRISE ($399/mo, 10000 Cr)</option>
                  <option value="SAASS">SAAS-S (Outcome-based managed)</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
                <span className="text-xs text-zinc-400">Account Active State</span>
                <button
                  onClick={() => updateMutation.mutate({ isActive: !client.isActive })}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold border transition ${
                    client.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {client.isActive ? "Active" : "Suspended"}
                </button>
              </div>
            </div>
          </div>

          {/* Card: Adjust Wallet Credits */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md">
            <h2 className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-4">
              <CreditCard className="h-4 w-4 text-amber-400" /> Adjust Wallet Credits
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                <span className="text-xs text-zinc-500">Current Balance:</span>
                <span className="text-lg font-bold text-indigo-400">{client.creditWallet?.balance ?? 0} Credits</span>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase font-semibold">Credit Allowance Amount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
                  />
                  <button
                    onClick={() =>
                      adjustMutation.mutate({ orgId: client.id, amount: creditAmount, reason: creditReason })
                    }
                    disabled={adjustMutation.isPending || !creditReason}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 text-xs font-bold text-white transition flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Grant
                  </button>
                  <button
                    onClick={() =>
                      adjustMutation.mutate({ orgId: client.id, amount: -creditAmount, reason: creditReason })
                    }
                    disabled={adjustMutation.isPending || !creditReason}
                    className="rounded-xl bg-red-600 hover:bg-red-500 px-4 text-xs font-bold text-white transition flex items-center gap-1"
                  >
                    <Minus className="h-3.5 w-3.5" /> Deduct
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase font-semibold">Audit Reason / Description</label>
                <input
                  type="text"
                  placeholder="e.g. UPI balance upgrade"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: manual invoicing & user grids */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card: Record UPI B2B payment */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
            <h2 className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Record UPI B2B Retainer payment
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase font-semibold">Amount Received (INR/USD)</label>
                <input
                  type="number"
                  value={paymentCash}
                  onChange={(e) => setPaymentCash(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase font-semibold">Allocated Credits</label>
                <input
                  type="number"
                  value={paymentCredits}
                  onChange={(e) => setPaymentCredits(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase font-semibold">UPI reference number</label>
                <input
                  type="text"
                  placeholder="e.g. TXN982461947"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() =>
                    paymentMutation.mutate({
                      orgId: client.id,
                      amount: paymentCash,
                      credits: paymentCredits,
                      method: paymentMethod,
                      reference: paymentRef,
                      notes: "UPI Manual Retainer recorded on dashboard.",
                    })
                  }
                  disabled={paymentMutation.isPending || !paymentRef}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 py-3 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {paymentMutation.isPending ? "Logging..." : "Record UPI Retainer Invoice"}
                </button>
              </div>
            </div>
          </div>

          {/* Users List & Tasks */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-3">
                <Users className="h-4 w-4 text-indigo-400" /> Authorized Team Users
              </span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {client.users?.map((user) => (
                  <div key={user.id} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900 text-xs">
                    <p className="font-semibold text-zinc-200">{user.name}</p>
                    <p className="text-zinc-500 text-[10px] mt-0.5">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <span className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-3">
                <Clock className="h-4 w-4 text-indigo-400" /> Recent Task History
              </span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {client.tasks?.map((task) => (
                  <div key={task.id} className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-950 border border-zinc-900 text-xs">
                    <span className="font-semibold text-zinc-300">{task.tool.name}</span>
                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] text-indigo-300 font-mono">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
