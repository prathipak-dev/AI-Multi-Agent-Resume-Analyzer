"use client";

import { useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  FileUp, Sparkles, Cpu, AlertTriangle, CheckCircle2, XCircle,
  Target, Zap, BarChart3, Eye, Edit3, ChevronDown, ChevronUp,
  ArrowRight, RefreshCw, BookOpen, TrendingUp, Shield, Clock,
  Search, FileText, RotateCcw
} from "lucide-react";
import { api, uploadResume } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Issue {
  id: number;
  title: string;
  section: string;
  severity: "critical" | "high" | "medium" | "low";
  why: string;
  fix: string;
  example?: string;
  affected_text?: string;
  status: "pending" | "accepted" | "rejected";
}

interface DeepAnalysis {
  resume_id: string;
  file_name: string;
  issues: Issue[];
  score: {
    overall: number;
    components: Record<string, number>;
    issue_counts: Record<string, number>;
  };
  contact_detected: Record<string, boolean>;
  sections_detected: Record<string, boolean>;
  length: { words: number; lines: number; verdict: string; message: string };
  target_domain: string;
}

interface JDMatch {
  match_score: {
    score: number;
    rating: string;
    color: string;
    disclaimer: string;
  };
  keyword_analysis: {
    matched: string[];
    missing_from_resume: string[];
    coverage_pct: number;
  };
  experience_match: { note: string; score: number; required?: number; estimated: number };
  strengths: string[];
  missing_skills: { heuristic: string[]; ai_analysis: any[]; note: string };
  recommendations: Array<{ priority: string; title: string; action: string }>;
}

// ─────────────────────────────────────────────
// Severity helpers
// ─────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: <XCircle className="h-4 w-4 text-red-400" />,
    label: "Critical"
  },
  high: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    icon: <AlertTriangle className="h-4 w-4 text-orange-400" />,
    label: "High"
  },
  medium: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
    label: "Medium"
  },
  low: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: <Eye className="h-4 w-4 text-slate-400" />,
    label: "Low"
  }
};

// ─────────────────────────────────────────────
// Score Ring Component
// ─────────────────────────────────────────────

function ScoreRing({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${progress} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute text-center" style={{ marginTop: -(size / 2 + 16) }}>
        {/* Score displayed via absolute layout below ring */}
      </div>
      <div className="flex flex-col items-center -mt-2">
        <span className="text-2xl font-black" style={{ color }}>{score}%</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Issue Card Component
// ─────────────────────────────────────────────

function IssueCard({
  issue,
  onAccept,
  onReject,
  onImprove
}: {
  issue: Issue;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onImprove: (issue: Issue) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low;

  if (issue.status === "rejected") return null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${cfg.bg} ${cfg.border} ${
        issue.status === "accepted" ? "opacity-50" : ""
      }`}
    >
      <button
        className="w-full p-4 text-left flex items-start gap-3"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="mt-0.5 flex-shrink-0">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{issue.section}</span>
            {issue.status === "accepted" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ Accepted
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-100">{issue.title}</p>
          {issue.affected_text && !expanded && (
            <p className="text-xs text-slate-500 mt-1 italic truncate">"{issue.affected_text}"</p>
          )}
        </div>
        <span className="flex-shrink-0 text-slate-500 mt-0.5">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3 ml-7">
          {issue.affected_text && (
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
              <p className="text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Affected text</p>
              <p className="text-xs text-slate-300 italic">"{issue.affected_text}"</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Why it matters</p>
            <p className="text-xs text-slate-300 leading-relaxed">{issue.why}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-emerald-400 mb-1 uppercase tracking-wider">Suggested fix</p>
            <p className="text-xs text-slate-200 leading-relaxed">{issue.fix}</p>
          </div>
          {issue.example && (
            <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-[10px] font-semibold text-emerald-400 mb-1 uppercase tracking-wider">Example</p>
              <p className="text-xs text-emerald-200 leading-relaxed font-mono">{issue.example}</p>
            </div>
          )}
          {issue.status === "pending" && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onAccept(issue.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept
              </button>
              <button
                onClick={() => onReject(issue.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                <XCircle className="h-3.5 w-3.5" /> Dismiss
              </button>
              {issue.affected_text && (
                <button
                  onClick={() => onImprove(issue)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-semibold hover:bg-violet-500/30 transition"
                >
                  <Zap className="h-3.5 w-3.5" /> AI Improve
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

type Tab = "upload" | "analysis" | "jd-match" | "improve";

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadData, setUploadData] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");

  // Deep analysis state
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);

  // JD Match state
  const [jdText, setJdText] = useState("");
  const [jdLoading, setJdLoading] = useState(false);
  const [jdMatch, setJdMatch] = useState<JDMatch | null>(null);
  const [jdError, setJdError] = useState("");

  // Improve state
  const [improveTarget, setImproveTarget] = useState("");
  const [improveLoading, setImproveLoading] = useState(false);
  const [improvedBullet, setImprovedBullet] = useState<any>(null);
  const [improveError, setImproveError] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");

  // Summary state
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ──
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadData(null);
      setUploadError("");
    }
  }, []);

  // ── Upload ──
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setUploadError("Please select a resume PDF or TXT file first."); return; }
    setUploadLoading(true);
    setUploadError("");
    setUploadData(null);
    try {
      const res = await uploadResume(file);
      setUploadData(res);
      setActiveTab("analysis");
      // Auto-run deep analysis
      runDeepAnalysis();
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || "Upload failed. Please check the backend and try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  // ── Deep Analysis ──
  const runDeepAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError("");
    try {
      const res = await api.get("/resume/deep-analysis");
      setAnalysis(res.data);
      setIssues(res.data.issues || []);
    } catch (err: any) {
      setAnalysisError(err?.response?.data?.detail || "Deep analysis failed. Please upload a resume first.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAcceptIssue = (id: number) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: "accepted" } : i));
  };
  const handleRejectIssue = (id: number) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: "rejected" } : i));
  };
  const handleImproveIssue = (issue: Issue) => {
    setImproveTarget(issue.affected_text || "");
    setActiveTab("improve");
  };

  // ── JD Match ──
  const runJDMatch = async () => {
    if (!jdText.trim() || jdText.length < 50) {
      setJdError("Please paste the full job description (at least 50 characters).");
      return;
    }
    setJdLoading(true);
    setJdError("");
    setJdMatch(null);
    try {
      const res = await api.post("/resume/analyze-jd", { job_description: jdText });
      setJdMatch(res.data);
    } catch (err: any) {
      setJdError(err?.response?.data?.detail || "JD analysis failed. Please upload a resume first.");
    } finally {
      setJdLoading(false);
    }
  };

  // ── Improve Bullet ──
  const runImproveBullet = async () => {
    if (!improveTarget.trim()) { setImproveError("Please enter a bullet point to improve."); return; }
    setImproveLoading(true);
    setImproveError("");
    setImprovedBullet(null);
    try {
      const res = await api.post("/resume/improve-bullet", {
        bullet: improveTarget,
        target_role: targetRole,
        context: ""
      });
      setImprovedBullet(res.data);
    } catch (err: any) {
      setImproveError(err?.response?.data?.detail || "Improvement failed. Please check that you have uploaded a resume.");
    } finally {
      setImproveLoading(false);
    }
  };

  // ── Improve Summary ──
  const runImproveSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.post("/resume/improve-summary", {
        target_role: targetRole,
        existing_summary: ""
      });
      setSummaryResult(res.data);
    } catch (err: any) {
      setImproveError(err?.response?.data?.detail || "Summary generation failed.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const tabs = [
    { id: "upload", label: "Upload", icon: FileUp },
    { id: "analysis", label: "Deep Analysis", icon: BarChart3 },
    { id: "jd-match", label: "JD Matcher", icon: Target },
    { id: "improve", label: "Improve", icon: Zap },
  ] as const;

  const pendingIssues = issues.filter(i => i.status === "pending");
  const criticalCount = issues.filter(i => i.severity === "critical" && i.status !== "rejected").length;
  const highCount = issues.filter(i => i.severity === "high" && i.status !== "rejected").length;

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-400" />
                  Resume Intelligence Studio
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deep analysis · JD matching · AI-powered improvements
                </p>
              </div>
              {analysis && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Overall score:</span>
                  <span className={`text-lg font-black ${
                    analysis.score.overall >= 75 ? "text-emerald-400" :
                    analysis.score.overall >= 50 ? "text-amber-400" : "text-red-400"
                  }`}>{analysis.score.overall}%</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === id
                      ? "bg-violet-500/20 text-violet-200 border border-violet-500/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {id === "analysis" && criticalCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[10px] font-bold">
                      {criticalCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* ─── UPLOAD TAB ─── */}
            {activeTab === "upload" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="glass-card rounded-2xl border border-slate-800 p-8">
                  <form onSubmit={handleUpload} className="space-y-4">
                    {/* Drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-violet-400 bg-violet-500/10"
                          : file
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-slate-700 hover:border-violet-500/50 hover:bg-violet-500/5"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        {file ? (
                          <>
                            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                            <p className="text-sm font-bold text-emerald-300">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                          </>
                        ) : (
                          <>
                            <FileUp className={`h-12 w-12 transition-all ${isDragging ? "text-violet-400 scale-110" : "text-slate-500"}`} />
                            <p className="text-sm font-bold text-slate-200">
                              {isDragging ? "Drop your resume here" : "Drag & drop or click to upload"}
                            </p>
                            <p className="text-xs text-slate-500">PDF or TXT · Max 10 MB</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        onChange={(e) => {
                          setFile(e.target.files?.[0] || null);
                          setUploadData(null);
                          setUploadError("");
                        }}
                        className="hidden"
                        id="resume-file-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={uploadLoading || !file}
                      className="w-full gradient-button text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {uploadLoading ? (
                        <><Cpu className="h-4 w-4 animate-spin" /> Analyzing resume…</>
                      ) : (
                        <><Sparkles className="h-4 w-4" /> Upload & Analyze Resume</>
                      )}
                    </button>
                  </form>

                  {uploadError && (
                    <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300 flex gap-2">
                      <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadData && (
                    <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                      <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-2">
                        <CheckCircle2 className="h-4 w-4" /> Resume uploaded successfully
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="text-center">
                          <div className="text-2xl font-black text-violet-300">{uploadData.ats_score ?? 0}%</div>
                          <div className="text-xs text-slate-400">ATS Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-emerald-300">{(uploadData.parsed_skills || []).length}</div>
                          <div className="text-xs text-slate-400">Skills found</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-200">{uploadData.target_domain}</div>
                          <div className="text-xs text-slate-400">Domain</div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveTab("analysis"); runDeepAnalysis(); }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-200 text-sm font-semibold hover:bg-violet-500/30 transition"
                      >
                        <BarChart3 className="h-4 w-4" /> Run Deep Analysis
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* What gets analyzed */}
                <div className="glass-card rounded-2xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-400" /> What gets analyzed
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Contact info & professional links",
                      "Essential section presence",
                      "Weak action verbs",
                      "Bullets missing measurable metrics",
                      "ATS formatting risks",
                      "Filler / vague phrases",
                      "Date inconsistencies",
                      "Skills completeness",
                      "Resume length & readability",
                      "AI-powered deep content analysis"
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── DEEP ANALYSIS TAB ─── */}
            {activeTab === "analysis" && (
              <div className="space-y-6">
                {analysisError && (
                  <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300 flex gap-2">
                    <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{analysisError}</span>
                  </div>
                )}

                {!analysis && !analysisLoading && !analysisError && (
                  <div className="max-w-lg mx-auto text-center py-16 space-y-4">
                    <BarChart3 className="h-12 w-12 text-slate-600 mx-auto" />
                    <p className="text-slate-400">Upload a resume first, or click below to analyze the latest one.</p>
                    <button
                      onClick={runDeepAnalysis}
                      className="gradient-button px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                    >
                      Run Deep Analysis
                    </button>
                  </div>
                )}

                {analysisLoading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-400 animate-spin" />
                      <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-400" />
                    </div>
                    <p className="text-slate-300 font-semibold">Running deep analysis pipeline…</p>
                    <p className="text-xs text-slate-500">Checking 12 categories — contact, sections, verbs, metrics, ATS risks…</p>
                  </div>
                )}

                {analysis && !analysisLoading && (
                  <>
                    {/* Score breakdown */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="glass-card-glowing rounded-2xl p-5 text-center">
                        <div className={`text-4xl font-black mb-1 ${
                          analysis.score.overall >= 75 ? "text-emerald-400" :
                          analysis.score.overall >= 50 ? "text-amber-400" : "text-red-400"
                        }`}>{analysis.score.overall}%</div>
                        <div className="text-xs text-slate-400">Overall Score</div>
                        <div className="mt-2 flex justify-center gap-1 flex-wrap">
                          {analysis.score.issue_counts.critical > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                              {analysis.score.issue_counts.critical} Critical
                            </span>
                          )}
                          {analysis.score.issue_counts.high > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                              {analysis.score.issue_counts.high} High
                            </span>
                          )}
                        </div>
                      </div>

                      {Object.entries(analysis.score.components).map(([key, val]) => (
                        <div key={key} className="glass-card rounded-2xl p-4 border border-slate-800">
                          <div className="text-xs text-slate-400 capitalize mb-1">{key.replace(/_/g, " ")}</div>
                          <div className={`text-2xl font-black ${val >= 75 ? "text-emerald-400" : val >= 50 ? "text-amber-400" : "text-red-400"}`}>{val}%</div>
                          <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${val >= 75 ? "bg-emerald-500" : val >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Section & contact checklist */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="glass-card rounded-2xl border border-slate-800 p-5">
                        <h3 className="font-bold text-white mb-3 text-sm">Section Checklist</h3>
                        <div className="space-y-2">
                          {Object.entries(analysis.sections_detected).map(([section, found]) => (
                            <div key={section} className="flex items-center gap-2">
                              {found
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                : <XCircle className="h-4 w-4 text-red-400" />}
                              <span className="text-xs capitalize text-slate-300">{section}</span>
                              {!found && <span className="text-[10px] text-red-400 ml-auto">Missing</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="glass-card rounded-2xl border border-slate-800 p-5">
                        <h3 className="font-bold text-white mb-3 text-sm">Contact Info</h3>
                        <div className="space-y-2">
                          {Object.entries(analysis.contact_detected).map(([item, found]) => (
                            <div key={item} className="flex items-center gap-2">
                              {found
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                : <XCircle className="h-4 w-4 text-amber-400" />}
                              <span className="text-xs capitalize text-slate-300">{item}</span>
                              {!found && <span className="text-[10px] text-amber-400 ml-auto">Not detected</span>}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
                          <p className="text-[10px] text-slate-400">{analysis.length.message}</p>
                        </div>
                      </div>
                    </div>

                    {/* Issue list */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          Issues ({pendingIssues.length} pending)
                        </h3>
                        <button
                          onClick={runDeepAnalysis}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Re-analyze
                        </button>
                      </div>

                      {pendingIssues.length === 0 && (
                        <div className="text-center py-8 glass-card rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                          <p className="text-sm font-bold text-emerald-300">All issues resolved or dismissed!</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {issues.map(issue => (
                          <IssueCard
                            key={issue.id}
                            issue={issue}
                            onAccept={handleAcceptIssue}
                            onReject={handleRejectIssue}
                            onImprove={handleImproveIssue}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── JD MATCHER TAB ─── */}
            {activeTab === "jd-match" && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyan-400" /> Paste Job Description
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Paste the full job description below. We'll analyze keyword coverage, experience match, and prioritize what to improve.
                  </p>
                  <textarea
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                    rows={10}
                    placeholder="Paste the complete job description here…&#10;&#10;Example: 'We are looking for a Senior Backend Engineer with 3+ years of experience in Python, FastAPI, and PostgreSQL…'"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 resize-y transition"
                  />
                  {jdError && (
                    <div className="mt-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">{jdError}</div>
                  )}
                  <button
                    onClick={runJDMatch}
                    disabled={jdLoading}
                    className="mt-4 w-full gradient-button text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition"
                  >
                    {jdLoading ? (
                      <><Cpu className="h-4 w-4 animate-spin" /> Analyzing match…</>
                    ) : (
                      <><Search className="h-4 w-4" /> Analyze Job Match</>
                    )}
                  </button>
                </div>

                {jdMatch && (
                  <div className="space-y-5">
                    {/* Match score */}
                    <div className="glass-card-glowing rounded-2xl border p-6 flex flex-col md:flex-row items-center gap-6" style={{
                      borderColor: jdMatch.match_score.color === 'green' ? 'rgba(16,185,129,0.4)' :
                                   jdMatch.match_score.color === 'yellow' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'
                    }}>
                      <div className="text-center flex-shrink-0">
                        <div className={`text-6xl font-black mb-1 ${
                          jdMatch.match_score.color === 'green' ? 'text-emerald-400' :
                          jdMatch.match_score.color === 'yellow' ? 'text-amber-400' : 'text-red-400'
                        }`}>{jdMatch.match_score.score}%</div>
                        <div className="text-sm font-bold text-slate-300">{jdMatch.match_score.rating}</div>
                        <div className="text-xs text-slate-500 mt-1">Keyword match score</div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-600 pl-3">
                          {jdMatch.match_score.disclaimer}
                        </p>
                        <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                          <p className="text-xs text-slate-300">{jdMatch.experience_match.note}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      {/* Matched keywords */}
                      <div className="glass-card rounded-2xl border border-slate-800 p-5">
                        <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Matched Keywords ({jdMatch.keyword_analysis.matched.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {jdMatch.keyword_analysis.matched.slice(0, 20).map(kw => (
                            <span key={kw} className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                              {kw}
                            </span>
                          ))}
                          {jdMatch.keyword_analysis.matched.length === 0 && (
                            <p className="text-xs text-slate-500">No matching keywords found</p>
                          )}
                        </div>
                      </div>

                      {/* Missing keywords */}
                      <div className="glass-card rounded-2xl border border-slate-800 p-5">
                        <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-400" /> Missing from Resume ({jdMatch.keyword_analysis.missing_from_resume.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {jdMatch.keyword_analysis.missing_from_resume.slice(0, 20).map(kw => (
                            <span key={kw} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                              {kw}
                            </span>
                          ))}
                          {jdMatch.keyword_analysis.missing_from_resume.length === 0 && (
                            <p className="text-xs text-emerald-400">No significant gaps!</p>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 italic">{jdMatch.missing_skills.note}</p>
                      </div>
                    </div>

                    {/* Strengths */}
                    {jdMatch.strengths && jdMatch.strengths.length > 0 && (
                      <div className="glass-card rounded-2xl border border-emerald-500/20 p-5 bg-emerald-500/5">
                        <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" /> Your Strengths for This Role
                        </h4>
                        <ul className="space-y-2">
                          {jdMatch.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="glass-card rounded-2xl border border-slate-800 p-5">
                      <h4 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-violet-400" /> Prioritized Recommendations
                      </h4>
                      <div className="space-y-3">
                        {jdMatch.recommendations.slice(0, 6).map((rec, i) => {
                          const pCfg = rec.priority === "high"
                            ? "border-red-500/30 bg-red-500/5 text-red-300"
                            : rec.priority === "medium"
                            ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
                            : "border-slate-700 bg-slate-900/40 text-slate-300";
                          return (
                            <div key={i} className={`p-4 rounded-xl border ${pCfg}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  rec.priority === "high" ? "bg-red-500/20 border-red-500/40 text-red-300" :
                                  rec.priority === "medium" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                                  "bg-slate-700 border-slate-600 text-slate-300"
                                }`}>{rec.priority}</span>
                                <span className="text-xs font-semibold text-slate-100">{rec.title}</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{rec.action}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── IMPROVE TAB ─── */}
            {activeTab === "improve" && (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Target role */}
                <div className="glass-card rounded-2xl border border-slate-800 p-5">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Target Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer, Data Scientist…"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition"
                  />
                </div>

                {/* Bullet improver */}
                <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-violet-400" /> Bullet Point Improver
                    </h3>
                    <p className="text-xs text-slate-400">Paste any resume bullet point to get an AI-powered rewrite using only the facts already present.</p>
                  </div>
                  <textarea
                    value={improveTarget}
                    onChange={e => setImproveTarget(e.target.value)}
                    rows={4}
                    placeholder="• Worked on the company's API to improve performance&#10;• Helped develop user authentication features&#10;• Responsible for fixing bugs in the frontend"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 resize-y transition"
                  />
                  <button
                    onClick={runImproveBullet}
                    disabled={improveLoading}
                    className="w-full gradient-button text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition"
                  >
                    {improveLoading ? (
                      <><Cpu className="h-4 w-4 animate-spin" /> Improving…</>
                    ) : (
                      <><Zap className="h-4 w-4" /> Improve Bullet</>
                    )}
                  </button>

                  {improveError && (
                    <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">{improveError}</div>
                  )}

                  {improvedBullet && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Original</p>
                        <p className="text-sm text-slate-400 line-through">{improvedBullet.original}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase mb-2">Improved</p>
                        <p className="text-sm text-emerald-200 font-medium">{improvedBullet.improved}</p>
                        {improvedBullet.placeholder_added && (
                          <p className="text-[10px] text-amber-400 mt-2">⚠ Placeholder [X] added — replace with your actual metric</p>
                        )}
                      </div>
                      <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                        <p className="text-[10px] font-semibold text-violet-400 uppercase mb-1">Why this works</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{improvedBullet.explanation}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">{improvedBullet.warning}</p>
                    </div>
                  )}
                </div>

                {/* Professional Summary */}
                <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-400" /> Professional Summary Generator
                    </h3>
                    <p className="text-xs text-slate-400">Generates a 3–4 sentence summary based on your uploaded resume's actual content.</p>
                  </div>
                  <button
                    onClick={runImproveSummary}
                    disabled={summaryLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-sm font-bold hover:bg-cyan-500/20 transition disabled:opacity-40"
                  >
                    {summaryLoading ? (
                      <><Cpu className="h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Generate Summary</>
                    )}
                  </button>
                  {summaryResult && (
                    <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/30 space-y-2">
                      <p className="text-[10px] font-semibold text-cyan-400 uppercase">Generated Summary</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{summaryResult.summary}</p>
                      <p className="text-[10px] text-slate-500">{summaryResult.word_count} words · {summaryResult.target_role}</p>
                      <p className="text-[10px] text-amber-400 italic">{summaryResult.warning}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AuthGuard>
  );
}