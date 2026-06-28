import { Link } from "react-router-dom";
import { Zap, Globe, LayoutDashboard, Brain, BookOpen } from "lucide-react";

export default function LauncherHub() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Zap className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        
        <h1 className="mb-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Welcome to Webness OS
        </h1>
        <p className="mb-12 text-lg text-zinc-400">
          Auth is disabled for local development. Choose a destination to begin working.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          <Link 
            to="/dashboard"
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5"
          >
            <LayoutDashboard className="mb-4 h-8 w-8 text-indigo-400" />
            <h3 className="mb-2 text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
              OS Dashboard
            </h3>
            <p className="text-sm text-zinc-500">
              Access the main agency dashboard, CRM, deal engine, and operations.
            </p>
          </Link>

          <a 
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5"
          >
            <Globe className="mb-4 h-8 w-8 text-emerald-400" />
            <h3 className="mb-2 text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
              Public Frontend
            </h3>
            <p className="text-sm text-zinc-500">
              View the public-facing Next.js website and lead capture funnels (Port 3000).
            </p>
          </a>

          <Link 
            to="/ai-os"
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition-all hover:border-purple-500/50 hover:bg-purple-500/5"
          >
            <Brain className="mb-4 h-8 w-8 text-purple-400" />
            <h3 className="mb-2 text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              Unified Brain
            </h3>
            <p className="text-sm text-zinc-500">
              Access the AI OS Memory, Automation Macros, and Hermes Gateway controls.
            </p>
          </Link>

          <Link 
            to="/ebook-writer"
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition-all hover:border-amber-500/50 hover:bg-amber-500/5"
          >
            <BookOpen className="mb-4 h-8 w-8 text-amber-400" />
            <h3 className="mb-2 text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
              KDP Publisher
            </h3>
            <p className="text-sm text-zinc-500">
              Generate ebooks and automatically publish them to Amazon KDP.
            </p>
          </Link>

        </div>
      </div>
    </div>
  );
}
