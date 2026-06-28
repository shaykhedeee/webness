import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Search, 
  Trash2, 
  Loader2, 
  PlusCircle, 
  Database,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import api from '../lib/api';

interface MemoryItem {
  id: string;
  contentType: string;
  content: string;
  metadata?: any;
  createdAt: string;
}

export default function MemoryViewer() {
  const [query, setQuery] = useState('');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'brand_voice' | 'correction' | 'research'>('brand_voice');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/ai-os/memory');
      if (response.data?.success) {
        setMemories(response.data.data || []);
      } else {
        setErrorMessage(response.data?.error || 'Failed to load memories');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching memories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || saving) return;

    setSaving(true);
    setErrorMessage('');
    try {
      const response = await api.post('/ai-os/memory', {
        content: newContent.trim(),
        contentType: newType,
        metadata: { manual_viewer: true }
      });
      if (response.data?.success) {
        setNewContent('');
        fetchMemories();
      } else {
        setErrorMessage(response.data?.error || 'Failed to save preference');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving preference');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!window.confirm('Are you sure you want to prune this semantic context node?')) return;
    try {
      const response = await api.delete(`/ai-os/memory/${id}`);
      if (response.data?.success) {
        setMemories(prev => prev.filter(m => m.id !== id));
      } else {
        setErrorMessage(response.data?.error || 'Failed to delete memory');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting memory');
    }
  };

  const filteredMemories = memories.filter(m => 
    m.content.toLowerCase().includes(query.toLowerCase()) || 
    m.contentType.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full bg-zinc-950 text-zinc-100 p-6 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center gap-2.5">
            <Brain className="h-6 w-6 text-purple-400" />
            Agentic Memory (Vector DB)
          </h1>
          <p className="text-zinc-400 mt-2 text-xs">Search and manage the shared semantic contexts injected into multi-agent prompts.</p>
        </div>
        <button 
          onClick={fetchMemories}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <Loader2 className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Reload Memory Nodes
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Left Side: Save Preference */}
        <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Ingest Preference Node</h2>
            </div>
            <p className="mb-4 text-[11px] text-zinc-500 leading-relaxed">
              Inject custom rules, guidelines, or business parameters. These facts are vector-indexed using text-embeddings and retrieved automatically to ground LLM outputs.
            </p>

            <form onSubmit={handleSaveMemory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] uppercase font-bold text-zinc-500">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['brand_voice', 'correction', 'research'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      className={`rounded-lg py-1.5 text-[10px] font-semibold uppercase tracking-wider border transition ${
                        newType === type
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase font-bold text-zinc-500">Content / Prompt Fact</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. Always write CSS layouts with glassmorphic styles and harmony-tailored dark modes."
                  rows={5}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={!newContent.trim() || saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/15 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ingesting embedding...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" /> Commit to Memory DB
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
            <Database className="h-3.5 w-3.5 text-zinc-700" />
            <span>nomic-embed-text-v1.5 (768d)</span>
          </div>
        </div>

        {/* Right Side: List & Search */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5">
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-650" />
              <input 
                type="text" 
                placeholder="Search semantic memory facts..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {loading ? (
              <div className="flex h-48 flex-col items-center justify-center text-zinc-500">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="mt-2 text-xs font-sans">Querying vector storage...</p>
              </div>
            ) : filteredMemories.map((memory) => (
              <div 
                key={memory.id} 
                className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-start gap-4 hover:border-zinc-750 transition-colors group"
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  memory.contentType === 'correction' ? 'bg-indigo-500/10 text-indigo-400' :
                  memory.contentType === 'research' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-purple-500/10 text-purple-400'
                }`}>
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                      {memory.contentType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">{memory.content}</p>
                </div>
                <button 
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {!loading && filteredMemories.length === 0 && (
              <div className="text-center text-zinc-650 py-16 text-xs font-sans border border-dashed border-zinc-850 rounded-2xl">
                <Brain className="h-10 w-10 text-zinc-800 mx-auto mb-2" />
                No active memory nodes found matching the query.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
