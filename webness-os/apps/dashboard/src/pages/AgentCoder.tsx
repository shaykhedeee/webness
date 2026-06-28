import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Code,
  Folder,
  FileText,
  Play,
  Loader2,
  Terminal,
  Database,
  Download,
  AlertTriangle,
  FileCode,
  Save,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import api from "../lib/api.js";

type WorkspaceFile = {
  name: string;
  isDir: boolean;
  sizeBytes: number;
  relativePath: string;
};

type TrainingRecord = {
  instruction: string;
  context: string;
  reasoning_steps: string;
  final_code: string;
  timestamp: string;
};

export default function AgentCoder() {
  // Navigation & File Explorer
  const [currentPath, setCurrentPath] = useState(".");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [fileTotalLines, setFileTotalLines] = useState(0);
  const [startLine, setStartLine] = useState(1);
  const [endLine, setEndLine] = useState(100);
  const [isTruncated, setIsTruncated] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  // Manual File Editor
  const [targetSearch, setTargetSearch] = useState("");
  const [replacement, setReplacement] = useState("");
  const [editingFile, setEditingFile] = useState(false);

  // OODA Coding Loop
  const [oodaTargetPath, setOodaTargetPath] = useState("");
  const [oodaInstruction, setOodaInstruction] = useState("Add code safety guards and validation functions");
  const [oodaVerification, setOodaVerification] = useState("pnpm build:dashboard");
  const [oodaMaxIterations, setOodaMaxIterations] = useState(3);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [oodaStatus, setOodaStatus] = useState<string>("idle");
  const [oodaLogs, setOodaLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch Workspace Directory Files
  const { data: filesData, refetch: refetchFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ["workspace-files", currentPath],
    queryFn: () => api.get(`/ai-os/files/list?path=${encodeURIComponent(currentPath)}`).then((r) => r.data),
  });

  // Fetch Fine-tuning training records
  const { data: trainingData, refetch: refetchTraining } = useQuery({
    queryKey: ["coder-training-data"],
    queryFn: () => api.get("/ai-os/coder/training-data").then((r) => r.data),
  });

  // Load File Range
  const loadFileContent = async (filePath: string) => {
    setLoadingFile(true);
    try {
      const res = await api.get(
        `/ai-os/coder/read-large?path=${encodeURIComponent(filePath)}&startLine=${startLine}&endLine=${endLine}`
      );
      if (res.data?.success) {
        setFileContent(res.data.content);
        setFileTotalLines(res.data.total_lines);
        setIsTruncated(res.data.is_truncated);
        setSelectedFile(filePath);
        setOodaTargetPath(filePath);
      } else {
        alert(res.data?.error || "Failed to load file");
      }
    } catch (err: any) {
      alert(err.message || "Failed to fetch file content");
    } finally {
      setLoadingFile(false);
    }
  };

  // Perform Manual replacement
  const handleManualEdit = async () => {
    if (!selectedFile || !targetSearch) return;
    setEditingFile(true);
    try {
      const res = await api.post("/ai-os/coder/edit", {
        path: selectedFile,
        target_search: targetSearch,
        replacement,
      });
      if (res.data?.success) {
        alert("File modified successfully!");
        loadFileContent(selectedFile);
        setTargetSearch("");
        setReplacement("");
      } else {
        alert(res.data?.error || "Edit replacement failed");
      }
    } catch (err: any) {
      alert(err.message || "Edit failed due to network error");
    } finally {
      setEditingFile(false);
    }
  };

  // Start autonomous OODA loop
  const handleLaunchOoda = async () => {
    if (!oodaTargetPath || !oodaInstruction) return;
    setOodaStatus("starting");
    setOodaLogs(["Connecting to local plan coordinator...", "Spawning OODA coder subagent..."]);
    try {
      const res = await api.post("/ai-os/coder/execute-ooda", {
        target_path: oodaTargetPath,
        instruction: oodaInstruction,
        verification_command: oodaVerification || null,
        max_iterations: oodaMaxIterations,
      });
      if (res.data?.success && res.data.runId) {
        setActiveRunId(res.data.runId);
        setOodaStatus("running");
      } else {
        setOodaStatus("failed");
        setOodaLogs((prev) => [...prev, `[ERROR] Failed to start OODA: ${res.data?.error}`]);
      }
    } catch (err: any) {
      setOodaStatus("failed");
      setOodaLogs((prev) => [...prev, `[ERROR] Connection error: ${err.message}`]);
    }
  };

  // Poll active OODA loop status
  useEffect(() => {
    if (!activeRunId || oodaStatus !== "running") return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/ai-os/coder/ooda-status/${activeRunId}`);
        if (res.data?.success && res.data.data) {
          const run = res.data.data;
          setOodaLogs(run.logs || []);
          if (run.status === "success") {
            setOodaStatus("success");
            setActiveRunId(null);
            refetchTraining();
            if (selectedFile) loadFileContent(selectedFile);
          } else if (run.status === "failed") {
            setOodaStatus("failed");
            setActiveRunId(null);
          }
        }
      } catch (err) {
        console.error("Failed to poll OODA status:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeRunId, oodaStatus]);

  // Scroll to bottom of terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [oodaLogs]);

  // Export dataset.jsonl file
  const handleExportDataset = () => {
    const records: TrainingRecord[] = trainingData?.records || [];
    if (records.length === 0) return;

    const fileContent = records
      .map((r) => JSON.stringify(r))
      .join("\n");

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `webness_coder_training_${new Date().toISOString().slice(0,10)}.jsonl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300">
                <Code className="h-5 w-5" />
              </div>
              Standalone Agentic Coder Workbench
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Autonomous developer platform powered by DeepSeek-R1 core and parallel local subagents. Edit files, analyze outlines, and collect training datasets offline.
            </p>
          </div>
          {trainingData?.records?.length > 0 && (
            <button
              onClick={handleExportDataset}
              className="flex items-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
            >
              <Download className="h-4 w-4" /> Export Fine-Tuning Data ({trainingData.records.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        
        {/* Safe Directory Explorer */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4 max-h-[640px] overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">File Explorer</span>
            <button
              onClick={() => refetchFiles()}
              className="text-zinc-500 hover:text-zinc-300"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 font-mono break-all bg-zinc-950 p-2 rounded border border-zinc-850">
            Path: {currentPath}
          </div>

          {currentPath !== "." && (
            <button
              onClick={() => {
                const parts = currentPath.split("/");
                parts.pop();
                setCurrentPath(parts.join("/") || ".");
              }}
              className="w-full text-left text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1"
            >
              ← Up a directory
            </button>
          )}

          <div className="space-y-1 flex-1">
            {loadingFiles ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
              </div>
            ) : filesData?.files?.length ? (
              filesData.files.map((file: WorkspaceFile) => (
                <button
                  key={file.relativePath}
                  onClick={() => {
                    if (file.isDir) {
                      setCurrentPath(file.relativePath);
                    } else {
                      loadFileContent(file.relativePath);
                    }
                  }}
                  className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded text-xs transition-colors hover:bg-zinc-800/50 ${
                    selectedFile === file.relativePath ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {file.isDir ? (
                      <Folder className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </span>
                  {!file.isDir && (
                    <span className="text-[9px] text-zinc-650 font-mono">
                      {(file.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-600 text-xs">Empty folder.</div>
            )}
          </div>
        </div>

        {/* Coder Main Panel */}
        <div className="space-y-6">
          
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            
            {/* OODA Control Console */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-indigo-400" /> OODA Loop Coder Agent
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Executes recursive cycles of: Observe file context → Orient pgvector rules → Decide replacements → Act modifications → Verify shell tests.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Target Workspace File</label>
                  <input
                    value={oodaTargetPath}
                    onChange={(e) => setOodaTargetPath(e.target.value)}
                    className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-zinc-300 font-mono"
                    placeholder="Select a file from the explorer or type path..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Coding Task Instruction</label>
                  <textarea
                    value={oodaInstruction}
                    onChange={(e) => setOodaInstruction(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-indigo-500 text-zinc-300 font-sans"
                    placeholder="What code does the agent need to implement or refactor?"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Verification Command</label>
                    <input
                      value={oodaVerification}
                      onChange={(e) => setOodaVerification(e.target.value)}
                      className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-zinc-300 font-mono"
                      placeholder="e.g. pnpm build, pytest..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Max OODA Attempts</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={oodaMaxIterations}
                      onChange={(e) => setOodaMaxIterations(Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-zinc-300"
                    />
                  </div>
                </div>

                <button
                  onClick={handleLaunchOoda}
                  disabled={oodaStatus === "running" || oodaStatus === "starting" || !oodaTargetPath || !oodaInstruction}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 transition-colors"
                >
                  {oodaStatus === "running" || oodaStatus === "starting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running Autonomous Loop...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Launch Coder OODA Loop
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* OODA Telemetry Terminal Screen */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col h-[380px] md:h-auto overflow-hidden">
              <div className="flex items-center gap-2 bg-zinc-900 border-b border-zinc-800 px-4 py-3 shrink-0">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-300 font-mono">Agent Terminal logs</span>
                <span className={`ml-auto h-2 w-2 rounded-full ${
                  oodaStatus === "running" ? "bg-indigo-400 animate-pulse" : oodaStatus === "success" ? "bg-emerald-400" : oodaStatus === "failed" ? "bg-red-400" : "bg-zinc-700"
                }`} />
              </div>
              <div className="flex-1 p-4 font-mono text-[10px] text-zinc-300 overflow-y-auto space-y-2 leading-relaxed bg-zinc-950">
                {oodaLogs.length === 0 ? (
                  <p className="text-zinc-600 text-center py-20">Awaiting OODA coder loop execution...</p>
                ) : (
                  oodaLogs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">
                      <span className="text-zinc-600">[{new Date().toLocaleTimeString().slice(0,5)}]</span>{" "}
                      <span className={
                        log.includes("[ERROR]") ? "text-red-400" :
                        log.includes("[VERIFY] Verification command succeeded!") ? "text-emerald-400 font-semibold" :
                        log.includes("[DECIDE]") ? "text-amber-400" :
                        log.includes("[ACT]") ? "text-indigo-300" :
                        log.includes("[ORIENT]") ? "text-cyan-400" :
                        log.includes("[OBSERVE]") ? "text-purple-400" : "text-zinc-300"
                      }>
                        {log}
                      </span>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>

          {/* Large File Viewport / Editor */}
          {selectedFile && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-bold text-zinc-200">{selectedFile}</span>
                  <span className="text-xs text-zinc-500 font-mono">({fileTotalLines} lines total)</span>
                </div>
                
                <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-850 text-xs">
                  <span className="text-zinc-500 shrink-0">Line range:</span>
                  <input
                    type="number"
                    value={startLine}
                    onChange={(e) => setStartLine(Number(e.target.value))}
                    className="w-12 bg-transparent outline-none text-zinc-300 text-center border-b border-zinc-800"
                  />
                  <span className="text-zinc-600">to</span>
                  <input
                    type="number"
                    value={endLine}
                    onChange={(e) => setEndLine(Number(e.target.value))}
                    className="w-12 bg-transparent outline-none text-zinc-300 text-center border-b border-zinc-800"
                  />
                  <button
                    onClick={() => loadFileContent(selectedFile)}
                    className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    Load
                  </button>
                </div>
              </div>

              {loadingFile ? (
                <div className="flex items-center justify-center py-20 bg-zinc-950 rounded-lg border border-zinc-850">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Contents display */}
                  <pre className="rounded-lg border border-zinc-850 bg-zinc-950 p-4 max-h-[300px] overflow-y-auto text-left font-mono text-[10px] text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                    <code>{fileContent}</code>
                  </pre>

                  {/* Regex Diff Editor */}
                  <div className="border-t border-zinc-800 pt-4 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Apply Exact Search-and-Replace Diff</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Use this to perform immediate manual adjustments. The target search must exactly match lines inside the file.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Target Content to Find</label>
                        <textarea
                          value={targetSearch}
                          onChange={(e) => setTargetSearch(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-zinc-750 bg-zinc-950 p-2 text-[10px] font-mono leading-relaxed outline-none focus:border-indigo-500 text-zinc-300"
                          placeholder="Paste the exact code block to be replaced..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Replacement Content</label>
                        <textarea
                          value={replacement}
                          onChange={(e) => setReplacement(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-zinc-750 bg-zinc-950 p-2 text-[10px] font-mono leading-relaxed outline-none focus:border-indigo-500 text-zinc-300"
                          placeholder="Paste the new code replacement block..."
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleManualEdit}
                      disabled={editingFile || !targetSearch}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {editingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Apply Replace Diff
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dataset Fine-tuning Table */}
          {trainingData?.records?.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-400" /> Fine-Tuning Datasets ({trainingData.records.length} records)
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Reasoning traces and final code chunks successfully compiled to fine-tune lightweight offline models locally.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-850 bg-zinc-950 overflow-hidden text-[10px] font-mono text-zinc-400">
                <div className="grid grid-cols-[1.5fr_2fr_1fr] bg-zinc-900 px-4 py-2 border-b border-zinc-800 text-zinc-300 font-semibold">
                  <span>Task Instruction</span>
                  <span>Reasoning Path Trace</span>
                  <span>Timestamp</span>
                </div>
                <div className="max-h-[160px] overflow-y-auto divide-y divide-zinc-900">
                  {trainingData.records.map((record: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-[1.5fr_2fr_1fr] px-4 py-2 hover:bg-zinc-900/50 transition-colors">
                      <span className="truncate pr-4 text-zinc-300">{record.instruction}</span>
                      <span className="truncate pr-4 text-zinc-500">{record.reasoning_steps}</span>
                      <span className="text-zinc-600">{record.timestamp || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
