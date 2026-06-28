import React, { useState } from 'react';
import { Play, Plus, Trash2, Settings, Zap } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'running' | 'completed';
}

export default function WorkflowBuilder() {
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'SEO Auditor', role: 'Scrapes targets & finds SEO metadata gaps', status: 'completed' },
    { id: '2', name: 'Nous Hermes copywriter', role: 'Generates blog templates addressing gaps', status: 'running' },
    { id: '3', name: 'Coder Agent', role: 'Executes node workspace server build', status: 'pending' }
  ]);
  const [executing, setExecuting] = useState(false);

  const startWorkflow = () => {
    setExecuting(true);
    setStages(prev => prev.map((s, idx) => ({
      ...s,
      status: idx === 0 ? 'running' : 'pending'
    })));

    // Simulation steps
    setTimeout(() => {
      setStages(prev => [
        { ...prev[0], status: 'completed' },
        { ...prev[1], status: 'running' },
        { ...prev[2], status: 'pending' }
      ]);
    }, 2000);

    setTimeout(() => {
      setStages(prev => [
        { ...prev[0], status: 'completed' },
        { ...prev[1], status: 'completed' },
        { ...prev[2], status: 'running' }
      ]);
    }, 4000);

    setTimeout(() => {
      setStages(prev => prev.map(s => ({ ...s, status: 'completed' })));
      setExecuting(false);
    }, 6000);
  };

  const addStage = () => {
    const id = (stages.length + 1).toString();
    setStages([...stages, {
      id,
      name: 'New Agent Node',
      role: 'Configurable custom worker action',
      status: 'pending'
    }]);
  };

  const deleteStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            Visual Workflow Node Editor
          </h2>
          <p className="text-xs text-zinc-400">Chain agentic tools, run them sequentially, and automatically forward outputs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addStage}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 bg-zinc-950 rounded text-xs text-zinc-300 hover:border-zinc-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Stage Node
          </button>
          <button
            onClick={startWorkflow}
            disabled={executing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded text-xs font-semibold hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Execute Pipeline
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 overflow-x-auto min-h-[220px] flex items-center gap-8 justify-center">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            <div className={`relative w-64 rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 ${
              stage.status === 'running' ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10' :
              stage.status === 'completed' ? 'bg-emerald-600/5 border-emerald-500/40' :
              'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-200">{stage.name}</span>
                <div className="flex gap-1">
                  <button className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300">
                    <Settings className="h-3 w-3" />
                  </button>
                  <button onClick={() => deleteStage(stage.id)} className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{stage.role}</p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">Stage #{idx + 1}</span>
                <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                  stage.status === 'running' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' :
                  stage.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-zinc-850 text-zinc-500'
                }`}>
                  {stage.status}
                </span>
              </div>
            </div>

            {idx < stages.length - 1 && (
              <div className="flex flex-col items-center">
                <div className="w-8 h-[2px] bg-zinc-800" />
                <span className="text-[10px] text-indigo-500/60 font-mono">FLOW</span>
              </div>
            )}
          </React.Fragment>
        ))}

        {stages.length === 0 && (
          <div className="text-center text-zinc-600 py-10">
            No pipeline stages defined. Click "Add Stage Node" to begin.
          </div>
        )}
      </div>
    </div>
  );
}
