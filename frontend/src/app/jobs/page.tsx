"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Briefcase, Search, MapPin, Building2, Star, StarOff,
  ExternalLink, Filter, ChevronDown, Cpu, XCircle,
  CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Bookmark
} from "lucide-react";
import { api } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

const DOMAINS = ["All", "Full Stack", "Frontend", "Backend", "DevOps", "AI/ML", "Data Science", "Mobile", "Cloud"];
const EXP_LEVELS = ["All", "Fresher", "0-2 yrs", "2-5 yrs", "5+ yrs"];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  job_type: string;
  domain: string;
  description: string;
  extracted_skills: string[];
  experience_level: string;
  source: string;
  bookmarked: boolean;
}

function JobCard({ job, onBookmark, onSelect }: {
  job: Job;
  onBookmark: (id: string) => void;
  onSelect: (job: Job) => void;
}) {
  const [bookmarking, setBookmarking] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarking(true);
    try {
      onBookmark(job.id);
    } finally {
      setBookmarking(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(job)}
      className="glass-card rounded-2xl border border-slate-800 p-5 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm group-hover:text-violet-200 transition truncate">{job.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate">{job.company}</span>
          </div>
        </div>
        <button
          onClick={handleBookmark}
          disabled={bookmarking}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
            job.bookmarked
              ? "text-amber-400 bg-amber-500/10"
              : "text-slate-600 hover:text-amber-400 hover:bg-amber-500/10"
          }`}
        >
          {job.bookmarked ? <Star className="h-4 w-4 fill-amber-400" /> : <Star className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <MapPin className="h-3 w-3" />{job.location}
        </span>
        {job.salary_range && (
          <span className="text-[10px] text-emerald-400 font-semibold">{job.salary_range}</span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">{job.experience_level}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/30 text-indigo-300">{job.domain}</span>
      </div>

      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{job.description}</p>

      {job.extracted_skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.extracted_skills.slice(0, 5).map(skill => (
            <span key={skill} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">
              {skill}
            </span>
          ))}
          {job.extracted_skills.length > 5 && (
            <span className="text-[10px] text-slate-600">+{job.extracted_skills.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
}

function JobDetailPanel({ job, onClose, onGenerate }: {
  job: Job;
  onClose: () => void;
  onGenerate: (jobId: string) => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/jobs/${job.id}`)
      .then(r => setDetail(r.data))
      .catch(() => setDetail(job))
      .finally(() => setLoading(false));
  }, [job.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/application/generate", { job_id: job.id });
      setGenerated(true);
      onGenerate(job.id);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to generate application.");
    } finally {
      setGenerating(false);
    }
  };

  const skillMatch = detail?.skill_match;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{job.title}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{job.company} · {job.location}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition p-1">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-3">
            {job.salary_range && (
              <span className="text-sm text-emerald-400 font-bold">{job.salary_range}</span>
            )}
            <span className="px-3 py-1 rounded-full text-xs border border-slate-700 text-slate-300">{job.experience_level}</span>
            <span className="px-3 py-1 rounded-full text-xs border border-indigo-500/30 text-indigo-300">{job.domain}</span>
            <span className="px-3 py-1 rounded-full text-xs border border-slate-700 text-slate-300">{job.job_type}</span>
          </div>

          {/* Skill match */}
          {skillMatch && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Your Skill Match — {skillMatch.score}%
              </h4>
              {skillMatch.matched.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-emerald-400 font-semibold mb-1 uppercase tracking-wider">You have</p>
                  <div className="flex flex-wrap gap-1">
                    {skillMatch.matched.map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">✓ {s}</span>
                    ))}
                  </div>
                </div>
              )}
              {skillMatch.missing.length > 0 && (
                <div>
                  <p className="text-[10px] text-rose-400 font-semibold mb-1 uppercase tracking-wider">Missing</p>
                  <div className="flex flex-wrap gap-1">
                    {skillMatch.missing.map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">+ {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Job Description</h4>
            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={generating || generated}
              className="flex-1 gradient-button py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              {generating ? (
                <><Cpu className="h-4 w-4 animate-spin" /> Generating…</>
              ) : generated ? (
                <><CheckCircle className="h-4 w-4" /> Generated! View in Applications</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> Generate Application Package</>
              )}
            </button>
            {generated && (
              <Link href="/application" className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition flex items-center">
                View Apps →
              </Link>
            )}
          </div>
          {generated && (
            <p className="text-xs text-slate-500 text-center">Tailored resume, cover letter, and HR email generated.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [experience, setExperience] = useState("All");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "bookmarks">("all");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (domain !== "All") params.set("domain", domain);
      if (experience !== "All") params.set("experience", experience);
      const url = activeTab === "bookmarks" ? "/jobs/bookmarks" : `/jobs/?${params}`;
      const res = await api.get(url);
      const jobList = activeTab === "bookmarks" ? res.data.bookmarks : res.data.jobs;
      setJobs(jobList || []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [query, domain, experience, activeTab]);

  useEffect(() => { fetchJobs(); }, [domain, experience, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleBookmark = async (jobId: string) => {
    try {
      const res = await api.post("/jobs/bookmark", { job_id: jobId });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, bookmarked: res.data.bookmarked } : j));
    } catch {}
  };

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
                  <Briefcase className="h-5 w-5 text-indigo-400" />
                  Job Explorer
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Discover, filter, and apply to real jobs matched to your skills.</p>
              </div>
              <button onClick={fetchJobs} disabled={loading} className="text-slate-400 hover:text-slate-200 transition disabled:opacity-40">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by role, company, or skill…"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition"
                />
              </div>
              <select value={domain} onChange={e => setDomain(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none">
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={experience} onChange={e => setExperience(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none">
                {EXP_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <button type="submit" className="gradient-button px-4 py-2.5 rounded-xl text-white text-sm font-semibold">
                Search
              </button>
            </form>

            {/* Tabs */}
            <div className="flex gap-2 mt-3">
              {(["all", "bookmarks"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === t ? "bg-violet-500/20 text-violet-200 border border-violet-500/30" : "text-slate-500 hover:text-slate-300"
                  }`}>
                  {t === "all" ? "All Jobs" : "⭐ Saved Jobs"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex flex-col items-center py-20 gap-3">
                <Cpu className="h-8 w-8 text-indigo-400 animate-spin" />
                <p className="text-slate-400 text-sm">Loading jobs…</p>
              </div>
            )}

            {!loading && error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <Briefcase className="h-12 w-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-semibold">
                  {activeTab === "bookmarks" ? "No saved jobs yet. Star jobs to save them." : "No jobs found. Try adjusting your filters."}
                </p>
                {activeTab === "all" && (
                  <button onClick={() => { setQuery(""); setDomain("All"); setExperience("All"); fetchJobs(); }}
                    className="text-xs text-violet-400 hover:underline">Clear filters</button>
                )}
              </div>
            )}

            {!loading && !error && jobs.length > 0 && (
              <>
                <p className="text-xs text-slate-500 mb-4">{jobs.length} jobs found</p>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onBookmark={handleBookmark}
                      onSelect={setSelectedJob}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onGenerate={() => {}}
        />
      )}
    </AuthGuard>
  );
}
