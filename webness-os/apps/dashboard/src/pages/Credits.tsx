import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import { formatCredits, timeAgo } from "../lib/utils.js";
import { CreditCard, ArrowUpRight, ArrowDownRight, Gift } from "lucide-react";

export default function Credits() {
  const { data: balance } = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.get("/credits/balance").then((r) => r.data),
  });

  const { data: history } = useQuery({
    queryKey: ["credit-history"],
    queryFn: () => api.get("/credits/history").then((r) => r.data),
  });

  const txnIcon = (type: string) => {
    if (type === "USAGE") return ArrowDownRight;
    if (type === "WELCOME_BONUS") return Gift;
    return ArrowUpRight;
  };

  const txnColor = (type: string) =>
    type === "USAGE" ? "text-red-400" : "text-emerald-400";

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Credits</h1>

      {/* ─── Balance Card ─────────────────────────────────── */}
      <div className="mb-8 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
        <div className="mb-2 flex items-center gap-2 text-indigo-400">
          <CreditCard className="h-5 w-5" />
          <span className="text-sm">Current Balance</span>
        </div>
        <p className="text-4xl font-bold">
          {formatCredits(balance?.data?.balance ?? 0)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">credits available</p>
      </div>

      {/* ─── Transaction History ───────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="font-semibold">Transaction History</h2>
        </div>

        {history?.data?.length ? (
          <div className="divide-y divide-zinc-800">
            {history.data.map((txn: any) => {
              const Icon = txnIcon(txn.type);
              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${txnColor(txn.type)}`} />
                    <div>
                      <p className="text-sm">
                        {txn.description || txn.type}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {timeAgo(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${txnColor(txn.type)}`}
                  >
                    {txn.amount > 0 ? "+" : ""}
                    {formatCredits(txn.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-500">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}
