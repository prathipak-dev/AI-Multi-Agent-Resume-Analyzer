"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileCheck, Briefcase, Users,
  TrendingUp, Send, MessageSquare, Settings, BookOpen, Sparkles
} from "lucide-react";

const MENU_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { name: "Resume Studio", href: "/resume", icon: FileCheck, group: "main" },
  { name: "Job Explorer", href: "/jobs", icon: Briefcase, group: "main" },
  { name: "Skill Gap & Growth", href: "/skill-gap", icon: TrendingUp, group: "main" },
  { name: "Applications", href: "/application", icon: Send, group: "main" },
  { name: "Recruiter Connect", href: "/recruiter", icon: Users, group: "main" },
  { name: "AI Career Coach", href: "/chat", icon: MessageSquare, group: "tools" },
  { name: "Settings", href: "/settings", icon: Settings, group: "tools" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const mainItems = MENU_ITEMS.filter(i => i.group === "main");
  const toolItems = MENU_ITEMS.filter(i => i.group === "tools");

  const renderItem = (item: typeof MENU_ITEMS[0]) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "border-violet-500/30 bg-violet-500/10 text-violet-100 shadow-lg shadow-violet-500/10"
            : "border-transparent text-slate-400 hover:border-slate-700/60 hover:bg-slate-900/80 hover:text-slate-100"
        }`}
      >
        <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-violet-300" : "text-slate-500"}`} />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="hidden min-h-[calc(100vh-73px)] w-60 border-r border-slate-800/60 bg-slate-950/60 p-4 backdrop-blur-xl lg:flex flex-col flex-shrink-0">
      <div className="flex-1 space-y-0.5">
        <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Platform
        </div>
        {mainItems.map(renderItem)}

        <div className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Tools
        </div>
        {toolItems.map(renderItem)}
      </div>

      {/* AI badge */}
      <div className="mt-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/8 via-slate-900 to-cyan-500/8 p-4">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
          <Sparkles className="h-3 w-3 text-violet-300" />
          AI Powered
        </div>
        <p className="text-[11px] leading-5 text-slate-400">
          Groq-powered resume analysis, JD matching, skill gaps, and career coaching.
        </p>
      </div>
    </aside>
  );
}

