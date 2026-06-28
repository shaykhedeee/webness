import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api.js";
import {
  Archive,
  BookOpen,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Hash,
  Import,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";

type VaultNote = {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  source: "manual" | "ebook" | "snapquote" | "blog" | "obsidian-import";
  wordCount: number;
};

const FOLDERS = ["All", "Inbox", "Ebooks", "Quotes", "Audits", "Strategy", "Blog Drafts"];

const SOURCE_COLORS: Record<string, string> = {
  manual: "bg-zinc-500/10 text-zinc-400",
  ebook: "bg-purple-500/10 text-purple-300",
  snapquote: "bg-amber-500/10 text-amber-300",
  blog: "bg-blue-500/10 text-blue-300",
  "obsidian-import": "bg-indigo-500/10 text-indigo-300",
};

export default function Vault() {
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<VaultNote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showImportModal, setShowImportModal] = useState(false);
  const [newNoteMode, setNewNoteMode] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Fetch vault documents
  const { data: vaultQuery, isLoading } = useQuery({
    queryKey: ["vaultNotes"],
    queryFn: () => api.get("/vault").then((r) => r.data),
  });

  const notes = useMemo<VaultNote[]>(() => {
    return vaultQuery?.data || [];
  }, [vaultQuery]);

  // Create document mutation
  const createMutation = useMutation({
    mutationFn: (newDoc: { title: string; content: string; folder: string; tags: string[]; source: string }) =>
      api.post("/vault", newDoc).then((r) => r.data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vaultNotes"] });
      if (res.data) setSelectedNote(res.data);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to create note.");
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vault/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultNotes"] });
      setSelectedNote(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to delete note.");
    }
  });

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchFolder = activeFolder === "All" || n.folder === activeFolder;
      const matchSearch =
        !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFolder && matchSearch;
    });
  }, [notes, activeFolder, searchQuery]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  function createNote() {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle,
      content: newContent || `# ${newTitle}\n\n`,
      folder: activeFolder === "All" ? "Inbox" : activeFolder,
      tags: [],
      source: "manual",
    });
    setNewNoteMode(false);
    setNewTitle("");
    setNewContent("");
  }

  function deleteNote(id: string) {
    if (confirm("Are you sure you want to delete this document from your vault?")) {
      deleteMutation.mutate(id);
    }
  }

  function handleImportObsidian(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.name.endsWith(".md")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        createMutation.mutate({
          title: file.name.replace(".md", ""),
          content,
          folder: "Inbox",
          tags: ["obsidian-import"],
          source: "obsidian-import",
        });
      };
      reader.readAsText(file);
    });

    setShowImportModal(false);
  }

  function exportNote(note: VaultNote) {
    const blob = new Blob([note.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ─── Left Panel: Folders + Notes List ─── */}
      <div className="flex w-80 flex-col border-r border-zinc-800">
        {/* Search */}
        <div className="border-b border-zinc-800 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500"
              placeholder="Search vault…"
            />
          </div>
        </div>

        {/* Folders */}
        <div className="border-b border-zinc-800 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Folders</span>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded p-1 ${viewMode === "grid" ? "text-indigo-400" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded p-1 ${viewMode === "list" ? "text-indigo-400" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-0.5">
            {FOLDERS.map((folder) => {
              const count = folder === "All" ? notes.length : notes.filter((n) => n.folder === folder).length;
              return (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(folder)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition ${
                    activeFolder === folder
                      ? "bg-indigo-500/10 text-indigo-300"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5" />
                    {folder}
                  </span>
                  {count > 0 && (
                    <span className="text-xs text-zinc-600">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-b border-zinc-800 p-3">
          <button
            onClick={() => setNewNoteMode(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" /> New Note
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            <Import className="h-3.5 w-3.5" /> Import
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-auto p-2">
          {filteredNotes.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-600">No notes found</p>
          )}
          <div className="space-y-1">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => { setSelectedNote(note); setNewNoteMode(false); }}
                className={`group w-full rounded-lg p-3 text-left transition ${
                  selectedNote?.id === note.id
                    ? "bg-indigo-500/10 border border-indigo-500/20"
                    : "hover:bg-zinc-800/50 border border-transparent"
                }`}
              >
                <p className="truncate text-sm font-medium text-zinc-200">{note.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${SOURCE_COLORS[note.source]}`}>
                    {note.source}
                  </span>
                  <span>{note.wordCount} words</span>
                  <Clock className="ml-auto h-3 w-3" />
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tags bar */}
        <div className="border-t border-zinc-800 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Hash className="mr-1 inline h-3 w-3" /> Tags
          </p>
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Note Editor / Viewer ─── */}
      <div className="flex flex-1 flex-col">
        {newNoteMode ? (
          <div className="flex flex-1 flex-col p-6">
            <h2 className="mb-4 text-lg font-bold text-zinc-200">Create New Note</h2>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mb-3 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              placeholder="Note title…"
              autoFocus
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm leading-6 outline-none focus:border-indigo-500"
              placeholder="Write your note in Markdown…"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={createNote}
                disabled={!newTitle.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                Create Note
              </button>
              <button
                onClick={() => setNewNoteMode(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedNote ? (
          <div className="flex flex-1 flex-col">
            {/* Note Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">{selectedNote.title}</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" /> {selectedNote.folder}
                  </span>
                  <span>{selectedNote.wordCount} words</span>
                  <span className={`rounded-full px-2 py-0.5 ${SOURCE_COLORS[selectedNote.source]}`}>
                    {selectedNote.source}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(selectedNote.content)}
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => exportNote(selectedNote)}
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                  title="Export .md"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Note tags */}
            {selectedNote.tags.length > 0 && (
              <div className="flex gap-1.5 border-b border-zinc-800/50 px-6 py-2">
                {selectedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Note content */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-zinc-300">
                {selectedNote.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Archive className="mb-3 h-12 w-12 text-zinc-800" />
            <h2 className="text-lg font-bold text-zinc-500">Webness Vault</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-600">
              Your knowledge base. All ebooks, quotes, audits, and notes — organized
              and searchable. Import from Obsidian or create new notes.
            </p>
          </div>
        )}
      </div>

      {/* ─── Import Modal ─── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-zinc-100">Import from Obsidian</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Select your .md files from your Obsidian vault folder. They'll be imported
              with tags and metadata preserved.
            </p>

            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-8 transition hover:border-indigo-500/50">
              <Upload className="h-8 w-8 text-zinc-600" />
              <span className="text-sm text-zinc-400">Click to select .md files</span>
              <span className="text-xs text-zinc-600">or drag & drop</span>
              <input
                type="file"
                accept=".md"
                multiple
                onChange={handleImportObsidian}
                className="hidden"
              />
            </label>

            <div className="mt-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20 px-3 py-2 text-xs text-indigo-300">
              💡 <strong>Pro tip:</strong> Select your entire Obsidian vault folder to import all notes at once.
              YAML frontmatter will be automatically parsed.
            </div>

            <button
              onClick={() => setShowImportModal(false)}
              className="mt-4 w-full rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
