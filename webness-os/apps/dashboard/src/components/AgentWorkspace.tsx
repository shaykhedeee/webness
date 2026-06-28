import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, 
  Play, 
  FileText, 
  Settings, 
  Activity, 
  Wifi, 
  WifiOff, 
  Database, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Cpu,
  Search,
  DollarSign
} from 'lucide-react';
import api from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  actions?: Array<{
    type: 'execute' | 'read_file' | 'write_file';
    command?: string;
    filePath?: string;
    content?: string;
    status?: 'pending' | 'running' | 'success' | 'failed';
    error?: string;
    result?: any;
  }>;
}

interface CostRecord {
  prompt: string;
  tokens: number;
  cost: number;
  timestamp: string;
}

export default function AgentWorkspace() {
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'system', content: 'Agentic OS Initialized. Coder Agent ready.' }
  ]);
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState<'chat' | 'cmd'>('chat');
  const [activeTab, setActiveTab] = useState<'preview' | 'terminal' | 'memory' | 'cost'>('terminal');
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ Coder Agent terminal initialized...']);
  const [currentFile, setCurrentFile] = useState<{ name: string; content: string } | null>(null);
  
  // Cost analytics state
  const [costRecords, setCostRecords] = useState<CostRecord[]>([
    { prompt: 'OS Initialization', tokens: 120, cost: 0.00009, timestamp: new Date().toLocaleTimeString() }
  ]);

  // Memory search state
  const [memoryQuery, setMemoryQuery] = useState('');
  const [memoryResults, setMemoryResults] = useState<any[]>([]);
  const [searchingMemory, setSearchingMemory] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>>(new Map());

  // WebSocket Connection Handler
  const connectWebSocket = useCallback(() => {
    setWsStatus('connecting');
    setTerminalOutput(prev => [...prev, '[system] Connecting to Coder Agent daemon on port 8081...']);
    
    try {
      const ws = new WebSocket('ws://localhost:8081');
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        setTerminalOutput(prev => [...prev, '[system] Connected to Coder Agent daemon successfully.']);
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        setTerminalOutput(prev => [...prev, '[system] Connection to Coder Agent daemon closed.']);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setWsStatus('disconnected');
        setTerminalOutput(prev => [...prev, '[system] Error connecting to Coder Agent daemon. Make sure packages/coder-agent is running.']);
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          const { id, status, data, error } = response;
          
          if (id && pendingRequests.current.has(id)) {
            const handlers = pendingRequests.current.get(id);
            pendingRequests.current.delete(id);
            if (handlers) {
              if (status === 'success') {
                handlers.resolve(data);
              } else {
                handlers.reject(new Error(error || 'Command failed'));
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      setWsStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Send message over WebSocket helper
  const sendWsMessage = (type: 'execute' | 'read_file' | 'write_file', payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }
      const id = Math.random().toString(36).substring(2, 9);
      pendingRequests.current.set(id, { resolve, reject });
      wsRef.current.send(JSON.stringify({ id, type, payload }));
    });
  };

  // Direct CLI Command run
  const runDirectCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    setTerminalOutput(prev => [...prev, `$ ${cmd}`]);
    setActiveTab('terminal');
    
    try {
      const response = await sendWsMessage('execute', { command: cmd });
      if (response.stdout) {
        setTerminalOutput(prev => [...prev, ...response.stdout.split('\n')]);
      }
      if (response.stderr) {
        setTerminalOutput(prev => [...prev, `[stderr] ${response.stderr}`]);
      }
    } catch (err: any) {
      setTerminalOutput(prev => [...prev, `[error] ${err.message}`]);
    }
  };

  // Search Semantic Memory context
  const searchMemory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memoryQuery.trim()) return;
    setSearchingMemory(true);
    try {
      const res = await api.get(`/ai-os/memory/context?q=${encodeURIComponent(memoryQuery)}`);
      if (res.data?.success && res.data.context) {
        // Just split and format the retrieved context
        setMemoryResults([{
          id: Date.now().toString(),
          content: res.data.context,
          type: 'retrieved_context',
          timestamp: 'Just now'
        }]);
      } else {
        setMemoryResults([]);
      }
    } catch (err) {
      console.error('Memory search error:', err);
    } finally {
      setSearchingMemory(false);
    }
  };

  // Run LLM Agent chat pipeline
  const submitAgentChat = async (userPrompt: string) => {
    setIsProcessing(true);
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userPrompt }]);
    setInput('');

    // System prompt instructing the model to reply in a strict JSON format containing actions
    const agentPrompt = `You are the Webness Coder Agent inside the Agentic OS Dashboard.
You have direct local computer/filesystem access via WebSocket.
If the user wants you to write, modify, or read a file, or execute commands, output a JSON object containing the actions to take.
Available Action types:
1. { "type": "read_file", "filePath": "path/to/file.ext" }
2. { "type": "write_file", "filePath": "path/to/file.ext", "content": "file contents..." }
3. { "type": "execute", "command": "shell-command" }

Example response structure if you need to create a file and run a command:
{
  "explanation": "I will create a hello-world component and run the compile check.",
  "actions": [
    { "type": "write_file", "filePath": "src/hello.ts", "content": "console.log('Hello World');" },
    { "type": "execute", "command": "node dist/hello.js" }
  ]
}

If no command or file operation is required (e.g. just answering a question), reply with:
{
  "explanation": "Your text answer goes here."
}

CRITICAL: Return ONLY raw JSON. Do NOT wrap it in \`\`\`json markdown blocks. Respond with a valid JSON string.

User instruction: ${userPrompt}`;

    try {
      const response = await api.post('/ai-os/council/run', {
        prompt: agentPrompt,
        purpose: 'Coder Agent Action Generation',
        models: ['gemini'] // Fast & Cost Effective Routing
      });

      const rawText = response.data?.data?.winner?.text || response.data?.data?.synthesis || '';
      
      // Track model cost estimation
      const tokenCount = rawText.length / 4 + agentPrompt.length / 4; // rough estimation
      const estCost = (tokenCount * 0.000001); // Flash rate
      setCostRecords(prev => [
        ...prev,
        { prompt: userPrompt.slice(0, 40) + '...', tokens: Math.round(tokenCount), cost: estCost, timestamp: new Date().toLocaleTimeString() }
      ]);

      // Parse JSON from model output
      let parsedResponse: { explanation: string; actions?: any[] };
      try {
        // Strip out any markdown code block wrappers if the model still outputs them
        let cleanText = rawText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
        parsedResponse = JSON.parse(cleanText);
      } catch (err) {
        parsedResponse = {
          explanation: rawText || 'Could not parse agent instruction block.'
        };
      }

      const agentMsgId = (Date.now() + 1).toString();
      const initialActions = parsedResponse.actions?.map(act => ({
        ...act,
        status: 'pending' as const
      })) || [];

      setMessages(prev => [...prev, {
        id: agentMsgId,
        role: 'agent',
        content: parsedResponse.explanation,
        actions: initialActions
      }]);

      // If we have actions, execute them sequentially via WebSocket daemon
      if (initialActions.length > 0) {
        setActiveTab('terminal');
        setTerminalOutput(prev => [...prev, `[agent] Initiating ${initialActions.length} automatic actions...`]);
        
        for (let i = 0; i < initialActions.length; i++) {
          const action = initialActions[i];
          
          // Update status to running
          setMessages(prev => prev.map(msg => {
            if (msg.id === agentMsgId && msg.actions) {
              const updated = [...msg.actions];
              updated[i].status = 'running';
              return { ...msg, actions: updated };
            }
            return msg;
          }));

          try {
            setTerminalOutput(prev => [...prev, `[action] Performing ${action.type}: ${action.command || action.filePath}`]);
            let res: any;
            if (action.type === 'execute') {
              res = await sendWsMessage('execute', { command: action.command });
              if (res.stdout) setTerminalOutput(prev => [...prev, ...res.stdout.split('\n')]);
              if (res.stderr) setTerminalOutput(prev => [...prev, `[stderr] ${res.stderr}`]);
            } else if (action.type === 'read_file') {
              res = await sendWsMessage('read_file', { filePath: action.filePath });
              setCurrentFile({ name: action.filePath, content: res.content });
              setActiveTab('preview');
            } else if (action.type === 'write_file') {
              res = await sendWsMessage('write_file', { filePath: action.filePath, content: action.content });
              setCurrentFile({ name: action.filePath, content: action.content });
              setActiveTab('preview');
            }

            // Update status to success
            setMessages(prev => prev.map(msg => {
              if (msg.id === agentMsgId && msg.actions) {
                const updated = [...msg.actions];
                updated[i].status = 'success';
                updated[i].result = res;
                return { ...msg, actions: updated };
              }
              return msg;
            }));
          } catch (actionErr: any) {
            setTerminalOutput(prev => [...prev, `[action failed] ${actionErr.message}`]);
            
            // Update status to failed
            setMessages(prev => prev.map(msg => {
              if (msg.id === agentMsgId && msg.actions) {
                const updated = [...msg.actions];
                updated[i].status = 'failed';
                updated[i].error = actionErr.message;
                return { ...msg, actions: updated };
              }
              return msg;
            }));
            break; // Stop sequential chain on failure
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'agent', 
        content: `Error calling AI OS agent orchestrator: ${err.message}` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    if (inputMode === 'cmd') {
      runDirectCommand(input);
      setInput('');
    } else {
      submitAgentChat(input);
    }
  };

  // Calculate cumulative cost metrics
  const totalTokensUsed = costRecords.reduce((acc, curr) => acc + curr.tokens, 0);
  const totalCostAccumulated = costRecords.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="flex h-[calc(100vh-120px)] w-full bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* ─── Left Pane: Interaction Command Center ─── */}
      <div className="w-1/3 border-r border-zinc-800 flex flex-col bg-zinc-950/40">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-zinc-300">
              Coder Agent
            </h2>
          </div>
          
          <button 
            onClick={connectWebSocket}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              wsStatus === 'connected' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : wsStatus === 'connecting'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {wsStatus === 'connected' ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {wsStatus === 'connected' ? 'Daemon Online' : wsStatus === 'connecting' ? 'Connecting...' : 'Daemon Offline'}
          </button>
        </div>
        
        {/* Messages Space */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`p-3 rounded-xl text-xs leading-relaxed transition-all border ${
                msg.role === 'user' 
                  ? 'bg-indigo-500/10 text-indigo-200 ml-8 border-indigo-500/20' 
                  : msg.role === 'system' 
                    ? 'bg-zinc-900/40 text-zinc-500 text-center italic border-zinc-800/60'
                    : 'bg-zinc-900/80 text-zinc-300 mr-8 border-zinc-800'
              }`}
            >
              <div className="font-semibold mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                {msg.role === 'user' ? 'User Instruction' : msg.role === 'system' ? 'System Status' : 'Agent Action'}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Action lists if present */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-zinc-800/80 space-y-1.5">
                  {msg.actions.map((act, index) => (
                    <div key={index} className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-[10px] font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-zinc-500">[{act.type}]</span>
                        <span className="text-indigo-400 truncate">{act.command || act.filePath}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase ${
                        act.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        act.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        act.status === 'running' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="p-3 bg-zinc-900/80 text-zinc-300 mr-8 border border-zinc-800 rounded-xl animate-pulse">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                <span className="text-[10px] text-zinc-500 font-semibold uppercase">Thinking...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Form controls */}
        <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-950/80">
          <div className="flex gap-2 mb-2 justify-center">
            <button
              type="button"
              onClick={() => setInputMode('chat')}
              className={`flex-1 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                inputMode === 'chat' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800/50 hover:bg-zinc-800'
              }`}
            >
              💬 AI Agent Chat
            </button>
            <button
              type="button"
              onClick={() => setInputMode('cmd')}
              className={`flex-1 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                inputMode === 'cmd' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800/50 hover:bg-zinc-800'
              }`}
            >
              ⚡ Direct CLI
            </button>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={inputMode === 'cmd' ? 'e.g. npm run build...' : 'Tell the coder agent what to build...'} 
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition disabled:opacity-40"
            >
              Run
            </button>
          </div>
        </form>
      </div>

      {/* ─── Right Pane: Multi-tab Display System ─── */}
      <div className="flex-1 flex flex-col bg-zinc-950/20">
        <div className="p-2 border-b border-zinc-800 bg-zinc-950/80 flex gap-2 items-center">
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'terminal' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Terminal Output
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'preview' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            File Preview
          </button>
          <button 
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'memory' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Semantic Memory
          </button>
          <button 
            onClick={() => setActiveTab('cost')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'cost' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Cost Tracker
          </button>
          
          <div className="flex-1" />
          <div className="text-[10px] font-mono text-zinc-500 px-3 bg-zinc-900 py-1 rounded border border-zinc-800 flex items-center gap-1">
            <span>Session:</span>
            <span className="text-zinc-300 font-bold">${totalCostAccumulated.toFixed(5)}</span>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs">
          
          {/* TERMINAL TAB */}
          {activeTab === 'terminal' && (
            <div className="h-full bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-zinc-400 overflow-y-auto space-y-1">
              {terminalOutput.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap text-[11px] leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* FILE PREVIEW TAB */}
          {activeTab === 'preview' && (
            <div className="h-full flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-900/60 px-4 py-2 border-b border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400 font-sans">
                <span>Currently Viewing: <strong className="text-indigo-400 font-mono text-xs">{currentFile?.name || 'No file loaded'}</strong></span>
                {currentFile && (
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full font-semibold">Ready</span>
                )}
              </div>
              <div className="flex-1 p-4 overflow-auto bg-zinc-950">
                {currentFile ? (
                  <pre className="text-zinc-300 text-[11px] whitespace-pre-wrap">{currentFile.content}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center flex-col text-zinc-600 font-sans">
                    <FileText className="h-10 w-10 text-zinc-700 mb-2" />
                    <p className="text-xs">No project files loaded.</p>
                    <p className="text-[10px] mt-1 text-zinc-500">Instruct Coder Agent to read or modify a file to preview it here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEMANTIC MEMORY SEARCH TAB */}
          {activeTab === 'memory' && (
            <div className="h-full flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-hidden p-4 font-sans">
              <h3 className="text-sm font-bold text-zinc-200 mb-2">Memory RAG Context Search</h3>
              <p className="text-xs text-zinc-500 mb-4">Lookup embeddings context that is dynamically fed to the LLM agent model.</p>
              
              <form onSubmit={searchMemory} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={memoryQuery}
                  onChange={e => setMemoryQuery(e.target.value)}
                  placeholder="Type search terms (e.g. brand voice, user preferences)..." 
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={searchingMemory}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  Search
                </button>
              </form>

              <div className="flex-1 overflow-auto space-y-3">
                {searchingMemory ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                  </div>
                ) : memoryResults.length > 0 ? (
                  memoryResults.map(res => (
                    <div key={res.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        <span>{res.type}</span>
                        <span>{res.timestamp}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">{res.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center flex-col text-zinc-600 py-10">
                    <Database className="h-10 w-10 text-zinc-700 mb-2" />
                    <p className="text-xs">No memory contexts retrieved.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COST TRACKER TAB */}
          {activeTab === 'cost' && (
            <div className="h-full flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 font-sans space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 mb-1">BYOK Credit & Usage Analytics</h3>
                <p className="text-xs text-zinc-500">Real-time model calling token metrics and pricing calculations for current session.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Estimated Cost</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono mt-1">${totalCostAccumulated.toFixed(5)}</span>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Estimated Tokens</span>
                  <span className="text-xl font-bold text-zinc-200 font-mono mt-1">{totalTokensUsed}</span>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Model Router</span>
                  <span className="text-xl font-bold text-indigo-400 mt-1">Gemini Flash</span>
                </div>
              </div>

              <div className="flex-1 overflow-auto border border-zinc-800/80 rounded-xl bg-zinc-950/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-500">
                      <th className="p-3">Prompt/Action</th>
                      <th className="p-3">Tokens</th>
                      <th className="p-3">Cost</th>
                      <th className="p-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {costRecords.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30">
                        <td className="p-3 text-zinc-300 font-sans">{rec.prompt}</td>
                        <td className="p-3 text-zinc-400">{rec.tokens}</td>
                        <td className="p-3 text-emerald-500">${rec.cost.toFixed(6)}</td>
                        <td className="p-3 text-zinc-500 text-right">{rec.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
