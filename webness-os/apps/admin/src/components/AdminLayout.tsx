import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Activity,
  Brain,
  IndianRupee,
  ScrollText,
  Shield,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/tasks", icon: ListTodo, label: "Task Queue" },
  { to: "/system", icon: Activity, label: "System Health" },
  { to: "/brain", icon: Brain, label: "AI Brain" },
  { to: "/revenue", icon: IndianRupee, label: "Revenue" },
  { to: "/audit", icon: ScrollText, label: "Audit Log" },
];

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-zinc-950">
      {/* ─── Sidebar ────────────────────────────────────── */}
      <aside className="flex w-60 flex-col border-r border-zinc-800">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <Shield className="h-6 w-6 text-red-500" />
          <div>
            <span className="text-sm font-bold">Webness Admin</span>
            <p className="text-[10px] text-red-400">GOD MODE</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-red-500/10 text-red-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <p className="text-center text-[10px] text-zinc-600">
            Webness OS v0.1.0
          </p>
        </div>
      </aside>

      {/* ─── Main Content ───────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
