import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import { timeAgo } from "../lib/utils.js";
import { FolderKanban, ChevronRight } from "lucide-react";

export default function Projects() {
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects?limit=20").then((r) => r.data),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Projects</h1>
      <p className="mb-8 text-zinc-500">
        All your tool executions and their results.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : data?.data?.length ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {data.data.map((project: any) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                  <FolderKanban className="h-4 w-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {project.tool?.name ?? "Task"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {timeAgo(project.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    project.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : project.status === "FAILED"
                        ? "bg-red-500/10 text-red-400"
                        : project.status === "PROCESSING"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-500/10 text-zinc-400"
                  }`}
                >
                  {project.status}
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 text-zinc-500">
          <FolderKanban className="mb-3 h-10 w-10" />
          <p>No projects yet</p>
        </div>
      )}
    </div>
  );
}
