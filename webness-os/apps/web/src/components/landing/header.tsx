import Link from "next/link";
import Image from "next/image";

const navItems = [
  { href: "/portfolio", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/signal-room", label: "Signal Room" },
  { href: "/#process", label: "Process" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/apply", label: "Apply" },
];

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/75 backdrop-blur-md">
      <div className="container-md flex items-center justify-between gap-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/images/logo.png"
              alt="Webness Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-white transition-colors group-hover:text-emerald-300">
            Webness
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="http://localhost:3000" className="hidden text-sm font-medium text-slate-400 underline-offset-4 hover:underline sm:inline-flex">
            Client Login
          </Link>
          <Link href="/apply" className="btn-primary hidden text-sm sm:inline-flex">
            Apply For Signal Scan
          </Link>
        </div>
      </div>
    </header>
  );
}
