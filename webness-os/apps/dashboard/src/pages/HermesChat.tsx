import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Bot,
  ChevronDown,
  Copy,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Terminal,
  Cpu,
  Wifi,
  WifiOff,
  Activity,
  FolderKanban,
  FileText,
  ListTodo,
  AlertCircle,
  Play,
  Clock,
} from "lucide-react";
import api from "../lib/api.js";

type HermesModel = {
  name: string;
  size: string;
  provider: "ollama" | "jan" | "gemini" | "groq" | "hermes";
  status: "ready" | "loading" | "error";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  provider?: string;
  timestamp: Date;
  tokens?: number;
};

type AgentConfig = {
  id: string;
  name: string;
  role: string;
  model: string;
  provider: string;
  config: {
    system_prompt?: string;
    temperature?: number;
  };
};

type HermesLogItem = {
  id: string;
  agentName: string;
  action: string;
  status: string;
  message: string;
  tokensUsed?: number;
  latencyMs?: number;
  createdAt: string;
};

export default function HermesChat() {
  const [activeTab, setActiveTab] = useState<"chat" | "config" | "telemetry" | "kanban">("chat");

  // Chat Tab State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("hermes-agent");
  const [selectedProvider, setSelectedProvider] = useState<"ollama" | "jan" | "gemini" | "groq" | "hermes">("hermes");
  const [systemPromptKey, setSystemPromptKey] = useState("hermes");
  const [enhancing, setEnhancing] = useState(false);

  // Connectivity States
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [janOnline, setJanOnline] = useState(false);
  const [hermesOnline, setHermesOnline] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [availableModels, setAvailableModels] = useState<HermesModel[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Telemetry Tab State
  const [taskNameInput, setTaskNameInput] = useState("Marketing campaign draft");
  const [orchestratorPrompt, setOrchestratorPrompt] = useState("Research and draft a 500-word newsletter promoting our AI SEO audit tool.");

  const SYSTEM_PROMPTS: Record<string, string> = {
    hermes: "You are Hermes, a sovereign AI assistant for the Webness business operating system. You help manage businesses, generate content, analyze data, and automate workflows. You are direct, precise, and business-focused.",
    coder: "You are a senior full-stack engineer. Write clean, production-quality code. Explain your reasoning concisely.",
    writer: "You are a premium content writer. Create compelling, SEO-optimized content with a professional consultative tone.",
    researcher: "You are a deep research analyst. Provide thorough, cited analysis with actionable insights.",
  };

  // Queries for Telemetry and Configs
  const { data: agentsData, refetch: refetchAgents } = useQuery({
    queryKey: ["hermes-agents"],
    queryFn: () => api.get("/hermes/agents").then((r) => r.data),
    enabled: activeTab === "config",
  });

  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ["hermes-logs"],
    queryFn: () => api.get("/hermes/logs").then((r) => r.data),
    refetchInterval: activeTab === "telemetry" ? 4000 : false,
  });

  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ["hermes-tasks"],
    queryFn: () => api.get("/hermes/tasks").then((r) => r.data),
    refetchInterval: activeTab === "kanban" ? 6000 : false,
  });

  // Mutations
  const updateAgentMutation = useMutation({
    mutationFn: ({ id, model, provider, config }: { id: string; model: string; provider: string; config: any }) =>
      api.put(`/hermes/agents/${id}`, { model, provider, config }).then((r) => r.data),
    onSuccess: () => {
      refetchAgents();
      alert("Agent configuration updated successfully!");
    },
  });

  const runTaskMutation = useMutation({
    mutationFn: () =>
      api
        .post("/hermes/run", {
          taskName: taskNameInput,
          prompt: orchestratorPrompt,
        })
        .then((r) => r.data),
    onSuccess: (res) => {
      refetchLogs();
      if (res.success) {
        alert("Agent pipeline finished. Synthesis: \n" + res.answer.substring(0, 150) + "...");
      }
    },
  });

  const enhancePrompt = async () => {
    if (!input.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const token = localStorage.getItem("webness_token");
      const res = await fetch("/api/ai-os/prompt/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      if (data.success && data.enhancedPrompt) {
        setInput(data.enhancedPrompt);
      } else {
        alert(data.error || "Failed to enhance prompt");
      }
    } catch (err: any) {
      alert(err.message || "Failed to enhance prompt due to network issue");
    } finally {
      setEnhancing(false);
    }
  };

  // Check Ollama, Jan & Hermes connectivity
  useEffect(() => {
    async function checkConnections() {
      try {
        const ollamaRes = await fetch("http://localhost:11434/api/tags");
        if (ollamaRes.ok) {
          setOllamaOnline(true);
          const data = await ollamaRes.json();
          const models = (data.models || []).map((m: any) => ({
            name: m.name,
            size: (m.size / 1e9).toFixed(1) + " GB",
            provider: "ollama" as const,
            status: "ready" as const,
          }));
          setAvailableModels((prev) => [
            ...prev.filter((m) => m.provider !== "ollama"),
            ...models,
          ]);
        }
      } catch {
        setOllamaOnline(false);
      }

      try {
        const janRes = await fetch("http://localhost:1337/v1/models");
        if (janRes.ok) {
          setJanOnline(true);
          const data = await janRes.json();
          const models = (data.data || []).map((m: any) => ({
            name: m.id,
            size: "",
            provider: "jan" as const,
            status: "ready" as const,
          }));
          setAvailableModels((prev) => [
            ...prev.filter((m) => m.provider !== "jan"),
            ...models,
          ]);
        }
      } catch {
        setJanOnline(false);
      }

      try {
        const hermesRes = await fetch("http://127.0.0.1:8642/health");
        if (hermesRes.ok) {
          setHermesOnline(true);
          setAvailableModels((prev) => [
            ...prev.filter((m) => m.provider !== "hermes"),
            {
              name: "hermes-agent",
              size: "Active OS",
              provider: "hermes" as const,
              status: "ready" as const,
            },
          ]);
        } else {
          setHermesOnline(false);
        }
      } catch {
        setHermesOnline(false);
      }
    }

    checkConnections();
    const interval = setInterval(checkConnections, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      model: selectedModel,
      provider: selectedProvider,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      let memoryContext = "";
      try {
        const token = localStorage.getItem("webness_token");
        if (token) {
          const contextRes = await fetch(`/api/ai-os/memory/context?q=${encodeURIComponent(userMsg.content)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (contextRes.ok) {
            const contextData = await contextRes.json();
            if (contextData.success && contextData.context) {
              memoryContext = contextData.context;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch memory context:", e);
      }

      const baseSystemPrompt = SYSTEM_PROMPTS[systemPromptKey] || SYSTEM_PROMPTS.hermes;
      const finalSystemPrompt = memoryContext
        ? `${baseSystemPrompt}\n\n${memoryContext}`
        : baseSystemPrompt;

      let fullResponse = "";

      if (selectedProvider === "ollama") {
        const res = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: finalSystemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userMsg.content },
            ],
            stream: true,
          }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                  fullResponse += json.message.content;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullResponse } : m))
                  );
                }
              } catch {}
            }
          }
        }
      } else if (selectedProvider === "hermes") {
        const res = await fetch("http://127.0.0.1:8642/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer webness_shared_secret_vps_local_2026",
          },
          body: JSON.stringify({
            model: "hermes-agent",
            messages: [
              { role: "system", content: finalSystemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userMsg.content },
            ],
            stream: true,
          }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n").filter(Boolean);
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") break;
                try {
                  const json = JSON.parse(jsonStr);
                  const delta = json.choices?.[0]?.delta?.content || "";
                  fullResponse += delta;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullResponse } : m))
                  );
                } catch {}
              }
            }
          }
        }
      } else if (selectedProvider === "jan") {
        const res = await fetch("http://localhost:1337/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: finalSystemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userMsg.content },
            ],
            stream: true,
          }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n").filter(Boolean);
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6);
                if (jsonStr === "[DONE]") break;
                try {
                  const json = JSON.parse(jsonStr);
                  const delta = json.choices?.[0]?.delta?.content || "";
                  fullResponse += delta;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullResponse } : m))
                  );
                } catch {}
              }
            }
          }
        }
      } else {
        const token = localStorage.getItem("webness_token");
        const res = await api.post("/ai-os/council/run", {
          purpose: "Hermes Chat",
          prompt: userMsg.content,
          maxTokens: 4000,
        });
        fullResponse = res.data.data?.synthesis || "No response";
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullResponse } : m))
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `Error: ${err.message}` } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, selectedModel, selectedProvider, systemPromptKey, messages]);

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4">
      {/* ─── Top Bar & Navigation Tabs ─── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-4 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Hermes Mission Control</h1>
            <p className="text-xs text-zinc-500">Local RTX 3060 Agent Pipeline Coordinator</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {[
            { id: "chat", label: "Gateway Chat", icon: MessageSquare },
            { id: "telemetry", label: "Live Telemetry", icon: Activity },
            { id: "config", label: "Agent Configs", icon: Settings2 },
            { id: "kanban", label: "Tasks Kanban", icon: FolderKanban },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-amber-500 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Active Tab Content ─── */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          {/* Controls Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 bg-zinc-900/80">
            <div className="flex items-center gap-2 text-xs">
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${hermesOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                <Wifi className="h-3 w-3" /> Hermes {hermesOnline ? "Online" : "Offline"}
              </span>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${ollamaOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                <Wifi className="h-3 w-3" /> Ollama {ollamaOnline ? "Online" : "Offline"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] font-medium transition hover:border-zinc-600"
                >
                  <Cpu className="h-3 w-3 text-amber-300" />
                  {selectedModel}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showModelPicker && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-2xl space-y-1">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Available Engines</p>
                    {availableModels.map((m) => (
                      <button
                        key={`${m.provider}-${m.name}`}
                        onClick={() => {
                          setSelectedModel(m.name);
                          setSelectedProvider(m.provider);
                          setShowModelPicker(false);
                        }}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-zinc-800 ${
                          selectedModel === m.name ? "bg-amber-500/10 text-amber-300" : "text-zinc-400"
                        }`}
                      >
                        <span>{m.name}</span>
                        <span className="text-[10px] text-zinc-600">{m.provider}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={systemPromptKey}
                onChange={(e) => setSystemPromptKey(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-400"
              >
                <option value="hermes">🏛️ Hermes OS</option>
                <option value="coder">💻 Coder</option>
                <option value="writer">✍️ Writer</option>
                <option value="researcher">🔬 Researcher</option>
              </select>

              <button
                onClick={() => setMessages([])}
                className="rounded border border-zinc-700 bg-zinc-950 p-1 text-zinc-400 hover:text-zinc-200"
                title="Clear Chat"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Console */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center py-10">
                <Bot className="h-10 w-10 text-amber-500/40 mb-3" />
                <h3 className="text-sm font-bold text-zinc-300">Nous Hermes Chat Console</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Interact directly with the Hermes 3 local agent model. Query custom business preferences or request file modifications.
                </p>
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role !== "user" && (
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 text-amber-300">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-2.5 text-xs leading-relaxed max-w-[85%] ${
                    msg.role === "user" ? "bg-amber-500/10 text-amber-100" : "bg-zinc-950 text-zinc-300 border border-zinc-850"
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content || <Loader2 className="h-3 w-3 animate-spin" />}</div>
                    {msg.role !== "user" && msg.content && (
                      <div className="mt-2 flex gap-2 text-[10px] text-zinc-600">
                        <span>Engine: {msg.model}</span>
                        <button onClick={() => copyMessage(msg.content)} className="hover:text-zinc-300">Copy</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat Inputs */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/40">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-amber-500"
                placeholder="Message Hermes agent console..."
              />
              <button
                onClick={enhancePrompt}
                disabled={enhancing || !input.trim()}
                className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200"
              >
                {enhancing ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="rounded-lg bg-amber-500 p-2 text-zinc-950 font-bold hover:bg-amber-400"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "telemetry" && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] flex-1 min-h-0 overflow-hidden">
          {/* Left panel - Execution form */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Play className="h-4 w-4 text-amber-400" /> Orchestrate Hermes Pipeline
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Trigger the 5 agents simultaneously to research, draft, promote, and build your digital assets.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Task Name / Objective</label>
                <input
                  value={taskNameInput}
                  onChange={(e) => setTaskNameInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Pipeline Instruction Brief</label>
                <textarea
                  value={orchestratorPrompt}
                  onChange={(e) => setOrchestratorPrompt(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-3 text-xs leading-relaxed outline-none focus:border-amber-500"
                  placeholder="Detail the complete instructions for the Orchestrator agent to delegate..."
                />
              </div>
            </div>

            <button
              onClick={() => runTaskMutation.mutate()}
              disabled={runTaskMutation.isPending || !orchestratorPrompt.trim()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {runTaskMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Running Orchestrator Agent Pipeline...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Start Multi-Agent Run
                </>
              )}
            </button>
          </div>

          {/* Right panel - Live console log */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col min-h-0">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-amber-400" /> Database Telemetry Console
              </h2>
              <button
                onClick={() => refetchLogs()}
                className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300"
              >
                Refresh Log
              </button>
            </div>

            {/* Console list */}
            <div className="flex-1 overflow-auto rounded bg-zinc-950 p-4 font-mono text-[11px] leading-5 text-zinc-300 space-y-3 max-h-[400px]">
              {logsData?.data?.length ? (
                logsData.data.map((log: HermesLogItem) => (
                  <div key={log.id} className="border-b border-zinc-900 pb-2">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-amber-400 font-bold">[{log.agentName.toUpperCase()}]</span>
                      <span className="text-[10px] text-zinc-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5"><span className="text-zinc-600">ACTION:</span> {log.action}</p>
                    <p className="text-zinc-300 mt-1">{log.message}</p>
                    <div className="flex gap-3 text-[9px] text-zinc-600 mt-1">
                      <span>Status: <span className={log.status === "SUCCESS" ? "text-emerald-400" : "text-amber-400"}>{log.status}</span></span>
                      {log.latencyMs && <span>Latency: {log.latencyMs}ms</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-zinc-600">Console empty. Start a multi-agent run to stream telemetry logs.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-6 flex-1 overflow-auto">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-amber-400" /> Configure Hermes Ecosystem
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Override standard prompts and temperature rules for the 5 agents running in the local ecosystem.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {agentsData?.data ? (
              agentsData.data.map((agent: AgentConfig) => (
                <AgentEditorCard
                  key={agent.id}
                  agent={agent}
                  onSave={(updatedConfig) => updateAgentMutation.mutate({ id: agent.id, ...updatedConfig })}
                />
              ))
            ) : (
              <div className="col-span-2 py-20 text-center text-zinc-600">Loading configurations...</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "kanban" && (
        <div className="flex-1 grid gap-4 md:grid-cols-4 min-h-0 overflow-auto">
          <KanbanColumn
            title="Queued"
            status="QUEUED"
            tasks={tasksData?.data?.filter((t: any) => t.status === "QUEUED" || t.status === "DISPATCHED") || []}
          />
          <KanbanColumn
            title="Processing"
            status="PROCESSING"
            tasks={tasksData?.data?.filter((t: any) => t.status === "PROCESSING" || t.status === "REVIEWING") || []}
          />
          <KanbanColumn
            title="Completed"
            status="COMPLETED"
            tasks={tasksData?.data?.filter((t: any) => t.status === "COMPLETED") || []}
          />
          <KanbanColumn
            title="Failed"
            status="FAILED"
            tasks={tasksData?.data?.filter((t: any) => t.status === "FAILED" || t.status === "CANCELLED") || []}
          />
        </div>
      )}
    </div>
  );
}

// Sub-component for editing Agent Prompts
function AgentEditorCard({ agent, onSave }: { agent: AgentConfig; onSave: (data: any) => void }) {
  const [model, setModel] = useState(agent.model);
  const [systemPrompt, setSystemPrompt] = useState(agent.config.system_prompt || "");

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
        <h3 className="text-sm font-bold text-zinc-200">{agent.name} Agent</h3>
        <span className="rounded bg-zinc-900 px-2 py-0.5 text-[9px] font-mono text-zinc-500 uppercase">{agent.role}</span>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Model Tag</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs outline-none focus:border-amber-500"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Ecosystem Prompt Rules</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] leading-relaxed outline-none focus:border-amber-500"
        />
      </div>

      <button
        onClick={() => onSave({ model, provider: agent.provider, config: { ...agent.config, system_prompt: systemPrompt } })}
        className="w-full rounded bg-zinc-900 border border-zinc-850 text-xs py-1 text-zinc-300 hover:bg-zinc-800 font-semibold"
      >
        Save Config
      </button>
    </div>
  );
}

// Sub-component for Task Kanban Columns
function KanbanColumn({ title, status, tasks }: { title: string; status: string; tasks: any[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5 mb-3">
        <span className="text-xs font-bold text-zinc-300">{title}</span>
        <span className="rounded bg-zinc-950 px-2 py-0.5 text-[10px] font-bold text-zinc-500">{tasks.length}</span>
      </div>

      <div className="flex-1 overflow-auto space-y-2.5 pr-1 max-h-[400px]">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1.5 shadow-sm hover:border-zinc-700 transition">
            <div className="flex justify-between items-start gap-2">
              <span className="font-bold text-xs text-zinc-300">{task.tool?.name || "Pipeline Task"}</span>
              <Clock className="h-3 w-3 text-zinc-600 shrink-0 mt-0.5" />
            </div>
            <p className="text-[10px] text-zinc-500 truncate">{task.id}</p>
            <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-900">
              <span>Cost: {task.creditCost}c</span>
              <span>{new Date(task.queuedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {!tasks.length && (
          <div className="flex h-full items-center justify-center py-10 text-[10px] text-zinc-700 font-semibold">No tasks</div>
        )}
      </div>
    </div>
  );
}
