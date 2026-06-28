import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { formatCredits } from "../lib/utils.js";
import FloatingShapes from "./FloatingShapes.js";
import {
  LayoutDashboard,
  Wrench,
  FolderKanban,
  CreditCard,
  LogOut,
  Zap,
  Key,
  Briefcase,
  BrainCircuit,
  Bot,
  BookOpen,
  Archive,
  Brain,
  Globe,
  Search,
  Scale,
  Code,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/agent-workspace", icon: Bot, label: "Agent Workspace" },
  { to: "/memory-viewer", icon: BrainCircuit, label: "Memory Graph" },
  { to: "/hermes", icon: Bot, label: "Hermes" },
  { to: "/ai-os", icon: BrainCircuit, label: "AI OS" },
  { to: "/agent-coder", icon: Code, label: "Agent Coder" },
  { to: "/memory", icon: Brain, label: "Memory" },
  { to: "/tools", icon: Wrench, label: "Tools" },
  { to: "/ebook-writer", icon: BookOpen, label: "Ebook Writer" },
  { to: "/vault", icon: Archive, label: "Vault" },
  { to: "/notebook", icon: Search, label: "Notebook Space" },
  { to: "/link-scanner", icon: Globe, label: "Link Scanner" },
  { to: "/harbor-seo", icon: Globe, label: "Harbor SEO" },
  { to: "/legal", icon: Scale, label: "Legal AI (Mike OSS)" },
  { to: "/deal-engine", icon: Briefcase, label: "Deal Engine" },
  { to: "/signal-room", icon: FolderKanban, label: "Signal Room" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/credits", icon: CreditCard, label: "Credits" },
  { to: "/byok", icon: Key, label: "Key Vault" },
  { to: "/business-intelligence", icon: Briefcase, label: "BI Advisor" },
  { to: "/developer-settings", icon: Key, label: "Developer Keys" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* ─── Sidebar ────────────────────────────────────── */}
      <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-950">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">Webness</span>
            <span className="ml-1 text-xs font-medium text-indigo-400">OS</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-auto px-3 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User / Credits */}
        <div className="border-t border-zinc-800 p-4">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2">
            <span className="text-xs text-zinc-500">Credits</span>
            <span className="text-sm font-semibold text-indigo-400">
              {formatCredits(user?.creditBalance ?? 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-zinc-500">
                {user?.organization?.name}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ───────────────────────────────── */}
      <main className="relative flex-1 overflow-auto bg-zinc-950 text-zinc-100">
        <FloatingShapes />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
