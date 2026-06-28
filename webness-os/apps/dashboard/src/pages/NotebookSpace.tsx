import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  Folder,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  Bot,
  User,
  CheckSquare,
  Square,
  Search,
} from "lucide-react";
import api from "../lib/api.js";

type VaultNote = {
  id: string;
  title: string;
  folder: string;
  tags: string[];
  wordCount: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function NotebookSpace() {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch vault documents
  const { data: vaultQuery, isLoading } = useQuery({
    queryKey: ["vaultNotes"],
    queryFn: () => api.get("/vault").then((r) => r.data),
  });

  const notes = useMemo<VaultNote[]>(() => {
    return vaultQuery?.data || [];
  }, [vaultQuery]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) =>
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.folder.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  // Handle note selection
  function toggleNote(id: string) {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedDocIds(notes.map((n) => n.id));
  }

  function clearAll() {
    setSelectedDocIds([]);
  }

  // Mutation to send the question to Gemini Notebook chat
  const chatMutation = useMutation({
    mutationFn: (payload: { sourceIds: string[]; prompt: string; messages: ChatMessage[] }) =>
      api.post("/ai-os/notebook/chat", payload).then((r) => r.data),
    onSuccess: (res) => {
      if (res.success && res.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
      }
      setIsPending(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || "Failed to query Notebook Space.");
      setIsPending(false);
    }
  });

  async function handleSendMessage() {
    if (!input.trim() || isPending) return;
    if (selectedDocIds.length === 0) {
      alert("Please select at least one document source on the left to context-bind your conversation.");
      return;
    }

    const currentPrompt = input.trim();
    setInput("");
    setIsPending(true);

    const userMsg: ChatMessage = { role: "user", content: currentPrompt };
    setMessages((prev) => [...prev, userMsg]);

    chatMutation.mutate({
      sourceIds: selectedDocIds,
      prompt: currentPrompt,
      messages: messages
    });
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* ─── Left Side: Document Source Picker ─── */}
      <div className="flex w-80 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-zinc-200">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          Notebook Sources
        </h2>
        <p className="text-xs text-zinc-500 mb-4">Select the Vault documents to include in your query context.</p>

        {/* Source Controls */}
        <div className="mb-3 flex justify-between gap-2 border-b border-zinc-850 pb-3">
          <button onClick={selectAll} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            Select All
          </button>
          <button onClick={clearAll} className="text-xs font-semibold text-zinc-500 hover:text-zinc-400">
            Clear Selection
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-500"
            placeholder="Filter documents…"
          />
        </div>

        {/* List of Notes */}
        <div className="flex-1 overflow-auto space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-600">No notes found</p>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedDocIds.includes(note.id);
              return (
                <button
                  key={note.id}
                  onClick={() => toggleNote(note.id)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                    isSelected ? "bg-indigo-500/5 text-zinc-200" : "hover:bg-zinc-850 text-zinc-400"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-indigo-400">
                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{note.title}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-600 flex items-center gap-1">
                      <Folder className="h-3 w-3" /> {note.folder} • {note.wordCount} words
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Right Side: Context-bound Chat ─── */}
      <div className="flex flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        {/* Top bar info */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Notebook Space Chat</h2>
            <p className="text-[11px] text-zinc-500">
              Querying {selectedDocIds.length} document{selectedDocIds.length === 1 ? "" : "s"} from your private Vault.
            </p>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
                <Sparkles className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">Start a notebook audit</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
                Select your synced Obsidian files, marketing plans, or ebooks, then ask questions like "Summarize the core strategy" or "What is our target pricing plan?"
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`relative max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-500/15 text-indigo-100"
                    : "bg-zinc-950 border border-zinc-850 text-zinc-300"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isPending && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="rounded-xl px-4 py-2.5 text-xs bg-zinc-950 border border-zinc-850 text-zinc-500 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Synthesizing knowledge context…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input panel */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-xs outline-none focus:border-indigo-500"
              placeholder="Ask a question about the selected sources…"
            />
            <button
              onClick={handleSendMessage}
              disabled={isPending || !input.trim() || selectedDocIds.length === 0}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
