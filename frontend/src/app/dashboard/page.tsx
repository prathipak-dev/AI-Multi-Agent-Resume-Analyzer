
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Briefcase,
  Target,
  Sparkles,
  FileText,
  Send,
  ArrowUpRight,
  Cpu,
  CheckCircle,
} from "lucide-react";
import { getDashboardData } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

function DashboardContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardData()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || "Failed to load dashboard. Please check your connection.";
        setError(detail);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-indigo-400">
            <Cpu className="h-6 w-6 animate-spin" />
            <span className="text-sm font-semibold">
              Loading dashboard…
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-red-400 font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const hasResume = data?.user?.has_resume;

  const formatStat = (val: any, suffix = "") => {
    if (val === null || val === undefined) return "—";
    return `${val}${suffix}`;
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)]">

      <Sidebar />

      <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Top Welcome Banner */}
        <div className="glass-card-glowing p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              {stats.target_domain ? `Target Domain: ${stats.target_domain}` : "No resume uploaded yet"}
            </div>

            <h1 className="text-2xl font-bold text-white">
              Welcome back, {data?.user?.full_name || "Developer"}
            </h1>

            <p className="text-xs text-gray-400 mt-1">
              {hasResume
                ? "Resume parsed and ready — run the matching pipeline to discover top job matches."
                : "Upload your resume to activate AI-powered job matching and skill analysis."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="gradient-button text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg"
            >
              <Target className="h-4 w-4" />
              Run Matching Pipeline
            </Link>
          </div>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            {
              label: "Jobs Discovered",
              val: formatStat(stats.jobs_discovered),
              icon: Briefcase,
              color: "text-blue-400",
            },
            {
              label: "Top Matches (80%+)",
              val: formatStat(stats.top_matches_count),
              icon: Target,
              color: "text-emerald-400",
            },
            {
              label: "Avg Match Score",
              val: stats.avg_match_score != null ? `${stats.avg_match_score}%` : "\u2014",
              icon: Sparkles,
              color: "text-indigo-400",
            },
            {
              label: "ATS Compatibility",
              val: stats.ats_score != null ? `${stats.ats_score}%` : "\u2014",
              icon: FileText,
              color: "text-rose-400",
            },
            {
              label: "Resume Impact",
              val: stats.resume_score != null ? `${stats.resume_score}%` : "\u2014",
              icon: CheckCircle,
              color: "text-purple-400",
            },
            {
              label: "Apps Generated",
              val: formatStat(stats.applications_generated),
              icon: Send,
              color: "text-amber-400",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="glass-card p-4 rounded-xl border border-gray-800 hover:border-indigo-500/30 transition"
            >
              <card.icon className={`h-5 w-5 mb-2 ${card.color}`} />
              <div className="text-2xl font-extrabold text-white">
                {card.val}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Middle Section: Extracted Skills & Active Agents */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span>Parsed Tech Stack & Skill Inventory</span>
              <span className="text-xs text-indigo-400 font-medium">
                Agent 3 Output
              </span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {(data?.parsed_skills || []).length > 0 ? (
                (data?.parsed_skills || []).map(
                  (skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-surfaceHover border border-gray-700 text-xs font-semibold text-gray-200 flex items-center gap-1.5"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      {skill}
                    </span>
                  )
                )
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No skills parsed yet — upload your resume to populate your tech stack.
                </p>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-4">
            <h3 className="text-lg font-bold text-white">
              Live Agents Monitor
            </h3>

            <div className="space-y-2 text-xs">
              {[
                {
                  name: "Agent 1: Job Collector",
                  status: "Active (Jooble)",
                },
                {
                  name: "Agent 2: Classifier",
                  status: "Ready",
                },
                {
                  name: "Agent 3: Resume Intel",
                  status: "Parsed ATS 82%",
                },
                {
                  name: "Agent 4: Skill Gap",
                  status: "Roadmap Ready",
                },
                {
                  name: "Agent 5: Match Engine",
                  status: "Multi-Factor Vector",
                },
              ].map((agent, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface/50 border border-gray-800"
                >
                  <span className="text-gray-300 font-medium">
                    {agent.name}
                  </span>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Action Banner */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/resume"
            className="glass-card p-6 rounded-2xl border border-gray-800 hover:border-emerald-500/40 transition group"
          >
            <div className="flex justify-between items-center mb-2">
              <FileText className="h-6 w-6 text-emerald-400" />
              <ArrowUpRight className="h-5 w-5 text-gray-500 group-hover:text-emerald-400 transition" />
            </div>

            <h4 className="font-bold text-white mb-1">
              Upload & Audit Resume
            </h4>

            <p className="text-xs text-gray-400">
              Run PyPDF parsing and ATS compatibility analysis.
            </p>
          </Link>

          <Link
            href="/jobs"
            className="glass-card p-6 rounded-2xl border border-gray-800 hover:border-indigo-500/40 transition group"
          >
            <div className="flex justify-between items-center mb-2">
              <Target className="h-6 w-6 text-indigo-400" />
              <ArrowUpRight className="h-5 w-5 text-gray-500 group-hover:text-indigo-400 transition" />
            </div>

            <h4 className="font-bold text-white mb-1">
              View Job Match Matrix
            </h4>

            <p className="text-xs text-gray-400">
              Explore top ranked job postings matched by vector math.
            </p>
          </Link>

          <Link
            href="/skill-gap"
            className="glass-card p-6 rounded-2xl border border-gray-800 hover:border-rose-500/40 transition group"
          >
            <div className="flex justify-between items-center mb-2">
              <Sparkles className="h-6 w-6 text-rose-400" />
              <ArrowUpRight className="h-5 w-5 text-gray-500 group-hover:text-rose-400 transition" />
            </div>

            <h4 className="font-bold text-white mb-1">
              Skill Gap & Learning Path
            </h4>

            <p className="text-xs text-gray-400">
              Discover missing tech stack skills and 4-week roadmap.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

