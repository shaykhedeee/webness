import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import { formatCredits } from "../lib/utils.js";
import { Wrench, ArrowRight, Lock } from "lucide-react";

interface ToolSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  hasAccess?: boolean;
  accessible?: boolean;
}

export default function Tools() {
  const { data, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: () => api.get("/tools").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">AI Tools</h1>
      <p className="mb-8 text-zinc-500">
        Select a tool to execute. Credits are deducted per use.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data?.map((tool: ToolSummary) => {
          const hasAccess = tool.hasAccess ?? tool.accessible ?? false;

          return (
          <div
            key={tool.id}
            className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
          >
            {!hasAccess && (
              <div className="absolute right-4 top-4">
                <Lock className="h-4 w-4 text-zinc-600" />
              </div>
            )}

            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <Wrench className="h-5 w-5 text-indigo-400" />
            </div>

            <h3 className="mb-1 font-semibold">{tool.name}</h3>
            <p className="mb-4 text-sm text-zinc-500 line-clamp-2">
              {tool.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                {formatCredits(tool.creditCost)} credits
              </span>

              {hasAccess ? (
                <Link
                  to={`/tools/${tool.slug}`}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-indigo-500"
                >
                  Run <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <span className="text-xs text-zinc-600">Upgrade plan</span>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
