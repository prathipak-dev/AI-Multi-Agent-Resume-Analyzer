"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Send, FileText, Mail, Cpu, CheckCircle, XCircle,
  Clock, Trophy, AlertTriangle, ChevronRight, Copy,
  ArrowRight, RefreshCw, Filter, Briefcase, MessageSquare,
  Edit3, Plus, ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

type AppStatus = "Draft" | "Applied" | "Interview" | "Offer" | "Rejected";

const STATUS_CONFIG: Record<AppStatus, { color: string; bg: string; border: string; icon: any }> = {
  Draft: { color: "text-slate-400", bg: "bg-slate-700/40", border: "border-slate-600", icon: Edit3 },
  Applied: { color: "text-blue-300", bg: "bg-blue-500/15", border: "border-blue-500/30", icon: Send },
  Interview: { color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30", icon: MessageSquare },
  Offer: { color: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30", icon: Trophy },
  Rejected: { color: "text-rose-300", bg: "bg-rose-500/15", border: "border-rose-500/30", icon: XCircle },
};

const STATUS_LIST: AppStatus[] = ["Draft", "Applied", "Interview", "Offer", "Rejected"];

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  status: AppStatus;
  cover_letter_preview: string;
  created_at: string;
  has_cover_letter: boolean;
  has_tailored_resume: boolean;
  has_hr_email: boolean;
}

interface AppDetail {
  id: string;
  job_title: string;
  company: string;
  location: string;
  job_description: string;
  tailored_resume: string;
  cover_letter: string;
  hr_email: string;
  status: AppStatus;
  created_at: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-slate-500 hover:text-slate-300 transition p-1 rounded-lg hover:bg-slate-800">
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ApplicationCard({ app, onSelect, onStatusChange }: {
  app: Application;
  onSelect: (app: Application) => void;
  onStatusChange: (id: string, status: AppStatus) => void;
}) {
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.Draft;
  const Icon = cfg.icon;
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    setUpdating(true);
    try {
      await onStatusChange(app.id, e.target.value as AppStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(app)}
      className="glass-card rounded-2xl border border-slate-800 p-5 hover:border-violet-500/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm group-hover:text-violet-200 transition truncate">{app.job_title}</h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Briefcase className="h-3 w-3" />{app.company}
            {app.location && <span className="text-slate-600">· {app.location}</span>}
          </p>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <select
            value={app.status}
            onChange={changeStatus}
            disabled={updating}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition ${cfg.color} ${cfg.bg} ${cfg.border}`}
          >
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {app.cover_letter_preview && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 italic">"{app.cover_letter_preview}…"</p>
      )}

      <div className="flex items-center gap-3">
        {[
          { label: "Resume", has: app.has_tailored_resume },
          { label: "Cover Letter", has: app.has_cover_letter },
          { label: "HR Email", has: app.has_hr_email },
        ].map(item => (
          <span key={item.label} className={`text-[10px] flex items-center gap-1 ${item.has ? "text-emerald-400" : "text-slate-600"}`}>
            {item.has ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {item.label}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-slate-600">
          {new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      </div>
    </div>
  );
}

function AppDetailPanel({ appId, onClose, onStatusChange }: {
  appId: string;
  onClose: () => void;
  onStatusChange: (id: string, status: AppStatus) => void;
}) {
  const [detail, setDetail] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"cover" | "resume" | "email" | "prep">("cover");
  const [prep, setPrep] = useState<any>(null);
  const [loadingPrep, setLoadingPrep] = useState(false);

  useEffect(() => {
    api.get(`/application/${appId}`)
      .then(r => setDetail(r.data))
      .finally(() => setLoading(false));
  }, [appId]);

  const loadPrep = async () => {
    if (prep) return;
    setLoadingPrep(true);
    try {
      const res = await api.post("/application/interview-prep", { application_id: appId });
      setPrep(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to generate prep.");
    } finally {
      setLoadingPrep(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <Cpu className="h-8 w-8 text-violet-400 animate-spin" />
    </div>
  );

  if (!detail) return null;

  const cfg = STATUS_CONFIG[detail.status] || STATUS_CONFIG.Draft;

  const sections = [
    { id: "cover" as const, label: "Cover Letter", has: !!detail.cover_letter },
    { id: "resume" as const, label: "Tailored Resume", has: !!detail.tailored_resume },
    { id: "email" as const, label: "HR Email", has: !!detail.hr_email },
    { id: "prep" as const, label: "Interview Prep", has: false },
  ];

  const currentContent =
    activeSection === "cover" ? detail.cover_letter :
    activeSection === "resume" ? detail.tailored_resume :
    activeSection === "email" ? detail.hr_email : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{detail.job_title}</h2>
            <p className="text-slate-400 text-sm">{detail.company}{detail.location ? ` · ${detail.location}` : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              defaultValue={detail.status}
              onChange={e => onStatusChange(detail.id, e.target.value as AppStatus)}
              className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none ${cfg.color} ${cfg.bg} ${cfg.border}`}
            >
              {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition p-1">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Section tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => { setActiveSection(s.id); if (s.id === "prep") loadPrep(); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  activeSection === s.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                }`}>
                {s.id === "prep" ? "🎯 " : s.has ? "✓ " : ""}{s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeSection !== "prep" && currentContent && (
            <div className="relative">
              <div className="absolute right-3 top-3 z-10">
                <CopyButton text={currentContent} />
              </div>
              <pre className="whitespace-pre-wrap text-xs text-slate-300 bg-slate-800/60 rounded-xl p-4 pr-10 leading-relaxed font-sans max-h-[50vh] overflow-y-auto border border-slate-700">
                {currentContent}
              </pre>
            </div>
          )}

          {activeSection !== "prep" && !currentContent && (
            <div className="text-center py-8 text-slate-500 text-sm">No content generated for this section.</div>
          )}

          {activeSection === "prep" && (
            <div>
              {loadingPrep && (
                <div className="flex items-center justify-center py-10 gap-3">
                  <Cpu className="h-6 w-6 text-amber-400 animate-spin" />
                  <span className="text-sm text-slate-400">Generating interview questions…</span>
                </div>
              )}
              {!loadingPrep && !prep && (
                <div className="text-center py-10 space-y-3">
                  <MessageSquare className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-sm">AI-generated interview questions for this specific job.</p>
                  <button onClick={loadPrep} className="gradient-button px-6 py-2.5 rounded-xl text-white font-semibold text-sm">
                    Generate Questions
                  </button>
                </div>
              )}
              {!loadingPrep && prep && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">{prep.company} · {prep.job_title}</p>
                  {(prep.preparation_tips || []).length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs font-semibold text-amber-300 mb-2">💡 Preparation Tips</p>
                      {prep.preparation_tips.map((t: string, i: number) => (
                        <p key={i} className="text-xs text-slate-300 mt-1">• {t}</p>
                      ))}
                    </div>
                  )}
                  {(prep.questions || []).map((q: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          q.category === "Technical" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                          q.category === "Behavioral" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                          "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>{q.category}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          q.difficulty === "Hard" ? "bg-rose-500/20 text-rose-300" : q.difficulty === "Medium" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                        }`}>{q.difficulty}</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{q.question}</p>
                      {q.hint && <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-slate-700">💡 {q.hint}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<AppStatus | "All">("All");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/application/tracker");
      setApps(res.data.applications || []);
      setSummary(res.data.summary || {});
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  const handleStatusChange = async (id: string, status: AppStatus) => {
    await api.patch("/application/status", { application_id: id, status });
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setSummary(prev => {
      const old = { ...prev };
      const app = apps.find(a => a.id === id);
      if (app) {
        old[app.status] = Math.max(0, (old[app.status] || 1) - 1);
        old[status] = (old[status] || 0) + 1;
      }
      return old;
    });
  };

  const filtered = filter === "All" ? apps : apps.filter(a => a.status === filter);

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Send className="h-5 w-5 text-amber-400" />
                  Application Tracker
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Track every application — from draft to offer.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={loadApps} disabled={loading} className="text-slate-400 hover:text-slate-200 transition disabled:opacity-40">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
                <Link href="/jobs" className="gradient-button px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" /> New Application
                </Link>
              </div>
            </div>

            {/* Summary stats */}
            {Object.keys(summary).length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {STATUS_LIST.map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const count = summary[s] || 0;
                  return count > 0 ? (
                    <button key={s} onClick={() => setFilter(filter === s ? "All" : s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        filter === s ? `${cfg.color} ${cfg.bg} ${cfg.border}` : "text-slate-500 border-slate-700 hover:border-slate-600"
                      }`}>
                      <Icon className="h-3 w-3" />{s} <span className="opacity-70">{count}</span>
                    </button>
                  ) : null;
                })}
                {filter !== "All" && (
                  <button onClick={() => setFilter("All")} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition">
                    Clear filter ×
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex flex-col items-center py-20 gap-3">
                <Cpu className="h-8 w-8 text-amber-400 animate-spin" />
                <p className="text-slate-400 text-sm">Loading applications…</p>
              </div>
            )}

            {!loading && error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!loading && !error && apps.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <Send className="h-14 w-14 text-slate-700 mx-auto" />
                <div>
                  <p className="text-slate-300 font-bold text-lg">No applications yet</p>
                  <p className="text-slate-500 text-sm mt-1">Go to Job Explorer to generate your first tailored application.</p>
                </div>
                <Link href="/jobs" className="inline-flex items-center gap-2 gradient-button px-6 py-3 rounded-xl text-white font-semibold">
                  Browse Jobs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(app => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onSelect={a => setSelectedAppId(a.id)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}

            {!loading && !error && apps.length > 0 && filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                No applications with status "{filter}".
                <button onClick={() => setFilter("All")} className="ml-2 text-violet-400 hover:underline">Show all</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedAppId && (
        <AppDetailPanel
          appId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onStatusChange={async (id, status) => {
            await handleStatusChange(id, status);
          }}
        />
      )}
    </AuthGuard>
  );
}
