"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cpu, Sparkles, User, FileText, Briefcase, Zap, LogOut } from "lucide-react";
import { isAuthenticated, logout } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Zap },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/skill-gap", label: "Skill Gap", icon: Sparkles },
];

export default function Navbar() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-violet-500/30">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-black tracking-[-0.04em] text-white">CareerIntelligence</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Multi-agent suite</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-800/80 bg-slate-900/60 p-1 md:flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon className="h-4 w-4 text-violet-300" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/resume"
            className="gradient-button hidden items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upload resume
          </Link>

          {authed ? (
            <button
              onClick={() => {
                logout();
                setAuthed(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-violet-500/40 hover:text-white"
              aria-label="Login"
            >
              <User className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
