import React, { useRef, useEffect, useState } from 'react';
import { Network, RefreshCw, ZoomIn, ZoomOut, Database } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: 'context' | 'task' | 'error' | 'brand_voice' | 'research';
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export default function MemoryGraph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [zoom, setZoom] = useState(1);

  // Initialize randomized force nodes mimicking vector relationships
  const initGraph = () => {
    const memoryLabels = [
      { label: "User prefers dark mode & glassmorphism", type: "context" },
      { label: "Pricing page styled with HSL tailored system", type: "task" },
      { label: "Missing local docker-compose configuration", type: "error" },
      { label: "Brand tone: Sovereign, premium, futuristic", type: "brand_voice" },
      { label: "Gemini Flash performs better routing tasks", type: "research" },
      { label: "Analyst agent matched schema successfully", type: "task" },
      { label: "Database link timeout on pgvector connector", type: "error" },
      { label: "Obsidian Sync loaded FLYWHEEL.md", type: "research" }
    ];

    const newNodes: Node[] = memoryLabels.map((item, idx) => ({
      id: `node-${idx}`,
      label: item.label,
      type: item.type as any,
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));

    const newLinks: Link[] = [];
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        if (Math.random() > 0.6) {
          newLinks.push({
            source: newNodes[i].id,
            target: newNodes[j].id,
            value: Math.random() * 2 + 1
          });
        }
      }
    }
    setNodes(newNodes);
    setLinks(newLinks);
  };

  useEffect(() => {
    initGraph();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(zoom, zoom);

      // Simulation forces
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        // Bounce borders
        if (n.x < 20 || n.x > (canvas.width / zoom) - 20) n.vx *= -1;
        if (n.y < 20 || n.y > (canvas.height / zoom) - 20) n.vy *= -1;

        // Friction
        n.vx *= 0.99;
        n.vy *= 0.99;
      });

      // Draw links
      links.forEach((l) => {
        const sourceNode = nodes.find(n => n.id === l.source);
        const targetNode = nodes.find(n => n.id === l.target);
        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
          ctx.lineWidth = l.value;
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 8, 0, 2 * Math.PI);

        // Color based on memory node type
        switch (n.type) {
          case 'context': ctx.fillStyle = '#6366f1'; break;
          case 'task': ctx.fillStyle = '#10b981'; break;
          case 'error': ctx.fillStyle = '#ef4444'; break;
          case 'brand_voice': ctx.fillStyle = '#a855f7'; break;
          case 'research': ctx.fillStyle = '#06b6d4'; break;
          default: ctx.fillStyle = '#9ca3af';
        }

        ctx.fill();

        // Node outline/glow
        ctx.strokeStyle = selectedNode?.id === n.id ? '#ffffff' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw short labels
        ctx.fillStyle = '#d1d5db';
        ctx.font = '10px Inter';
        ctx.fillText(n.label.slice(0, 18) + '...', n.x + 12, n.y + 4);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, links, zoom, selectedNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    // Detect if clicked node
    const found = nodes.find(n => {
      const dist = Math.hypot(n.x - clickX, n.y - clickY);
      return dist < 15;
    });

    setSelectedNode(found || null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr] h-[480px]">
      <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
            <Network className="h-4 w-4 text-indigo-400" />
            Obsidian Memory Map (pgvector Knowledge Graph)
          </span>
          <div className="flex gap-1">
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button onClick={initGraph} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={700}
          height={380}
          onClick={handleCanvasClick}
          className="flex-1 cursor-pointer"
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-400" />
          Memory Inspector
        </h3>
        {selectedNode ? (
          <div className="space-y-4 flex-1 flex flex-col justify-between transition-all duration-300 opacity-100">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Memory Type</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    selectedNode.type === 'context' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                    selectedNode.type === 'task' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                    selectedNode.type === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
                    'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  }`}>
                    {selectedNode.type}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Vector Content</span>
                <p className="mt-1 text-sm text-zinc-300 bg-zinc-950 p-3 rounded border border-zinc-800 leading-relaxed font-mono">
                  {selectedNode.label}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Metadata Source</span>
                <p className="mt-0.5 text-xs text-zinc-400">obsidian-sync // THE_SOVEREIGN_FLYWHEEL.md</p>
              </div>
            </div>
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition">
              Optimize Vector Handoff
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500">
            <Network className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-xs">Click a node inside the knowledge graph to inspect dynamic context.</p>
          </div>
        )}
      </div>
    </div>
  );
}
