"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp, Target, CheckSquare, Square, Plus, X,
  BookOpen, Cpu, Lightbulb, AlertCircle, ChevronRight,
  Trophy, Code2, MessageSquare, ArrowRight, RefreshCw, Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

type MainTab = "goals" | "roadmap" | "projects" | "interview";

interface CareerGoal {
  has_goals: boolean;
  target_role: string;
  target_domain: string;
  target_companies: string[];
  skills_to_learn: string[];
  milestones: { title: string; done: boolean }[];
  projects: { title: string; url: string; skills: string[]; done: boolean }[];
  notes: string;
}

function GoalsEditor({ goal, onSaved }: { goal: CareerGoal; onSaved: () => void }) {
  const [form, setForm] = useState({
    target_role: goal.target_role || "",
    target_domain: goal.target_domain || "Full Stack",
    target_companies: (goal.target_companies || []).join(", "),
    skills_to_learn: (goal.skills_to_learn || []).join(", "),
    notes: goal.notes || "",
    milestones: goal.milestones || [],
    projects: goal.projects || [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");
  const [newProject, setNewProject] = useState({ title: "", url: "", skills: "" });

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setForm(f => ({ ...f, milestones: [...f.milestones, { title: newMilestone.trim(), done: false }] }));
    setNewMilestone("");
  };

  const toggleMilestone = (i: number) => {
    const ms = [...form.milestones];
    ms[i] = { ...ms[i], done: !ms[i].done };
    setForm(f => ({ ...f, milestones: ms }));
  };

  const removeMilestone = (i: number) => {
    setForm(f => ({ ...f, milestones: f.milestones.filter((_, idx) => idx !== i) }));
  };

  const addProject = () => {
    if (!newProject.title.trim()) return;
    setForm(f => ({
      ...f,
      projects: [...f.projects, {
        title: newProject.title.trim(),
        url: newProject.url.trim(),
        skills: newProject.skills.split(",").map(s => s.trim()).filter(Boolean),
        done: false
      }]
    }));
    setNewProject({ title: "", url: "", skills: "" });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/career/goals", {
        target_role: form.target_role,
        target_domain: form.target_domain,
        target_companies: form.target_companies.split(",").map(s => s.trim()).filter(Boolean),
        skills_to_learn: form.skills_to_learn.split(",").map(s => s.trim()).filter(Boolean),
        milestones: form.milestones,
        projects: form.projects,
        notes: form.notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const done = form.milestones.filter(m => m.done).length;
  const total = form.milestones.length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Progress bar */}
      {total > 0 && (
        <div className="glass-card rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">Milestone Progress</p>
            <p className="text-sm font-bold text-violet-300">{done}/{total}</p>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="font-bold text-white">Career Targets</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Role</label>
            <input value={form.target_role} onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Domain</label>
            <select value={form.target_domain} onChange={e => setForm(f => ({ ...f, target_domain: e.target.value }))}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
              {["Full Stack", "Frontend", "Backend", "DevOps", "AI/ML", "Data Science", "Mobile", "Cloud"].map(d =>
                <option key={d} value={d}>{d}</option>
              )}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Target Companies (comma-separated)</label>
          <input value={form.target_companies} onChange={e => setForm(f => ({ ...f, target_companies: e.target.value }))}
            placeholder="Google, Microsoft, Zepto, Swiggy…"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Skills to Learn (comma-separated)</label>
          <input value={form.skills_to_learn} onChange={e => setForm(f => ({ ...f, skills_to_learn: e.target.value }))}
            placeholder="Kubernetes, Rust, TypeScript, AWS…"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} placeholder="Anything else to track…"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60 resize-none" />
        </div>
      </div>

      {/* Milestones */}
      <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-3">
        <h3 className="font-bold text-white">Learning Milestones</h3>
        <div className="space-y-2">
          {form.milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <button onClick={() => toggleMilestone(i)}
                className={`flex-shrink-0 transition ${m.done ? "text-emerald-400" : "text-slate-600"}`}>
                {m.done ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </button>
              <span className={`flex-1 text-sm ${m.done ? "line-through text-slate-600" : "text-slate-300"}`}>{m.title}</span>
              <button onClick={() => removeMilestone(i)} className="text-slate-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMilestone()}
            placeholder="Add a milestone (press Enter)…"
            className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60" />
          <button onClick={addMilestone} className="px-3 py-2 rounded-xl border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Portfolio projects */}
      <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-3">
        <h3 className="font-bold text-white">Portfolio Projects</h3>
        <div className="space-y-2">
          {form.projects.map((p, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 group">
              <button onClick={() => {
                const ps = [...form.projects];
                ps[i] = { ...ps[i], done: !ps[i].done };
                setForm(f => ({ ...f, projects: ps }));
              }} className={`flex-shrink-0 ${p.done ? "text-emerald-400" : "text-slate-600"}`}>
                {p.done ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${p.done ? "line-through text-slate-600" : "text-slate-200"}`}>{p.title}</p>
                {p.skills.length > 0 && <p className="text-[10px] text-slate-500">{p.skills.join(", ")}</p>}
              </div>
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-violet-400 text-[10px] hover:underline truncate max-w-[80px]">Link ↗</a>}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="grid md:grid-cols-2 gap-2">
            <input value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
              placeholder="Project title"
              className="bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60" />
            <input value={newProject.url} onChange={e => setNewProject(p => ({ ...p, url: e.target.value }))}
              placeholder="GitHub / live URL (optional)"
              className="bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60" />
          </div>
          <div className="flex gap-2">
            <input value={newProject.skills} onChange={e => setNewProject(p => ({ ...p, skills: e.target.value }))}
              placeholder="Skills used (comma-separated)"
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60" />
            <button onClick={addProject} className="px-3 py-2 rounded-xl border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="gradient-button px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50">
        {saving ? <><Cpu className="h-4 w-4 animate-spin" />Saving…</> : saved ? <><CheckSquare className="h-4 w-4" />Saved!</> : "Save Goals & Progress"}
      </button>
    </div>
  );
}

export default function SkillGapPage() {
  const [tab, setTab] = useState<MainTab>("goals");
  const [goal, setGoal] = useState<CareerGoal | null>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [projects, setProjects] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/career/goals");
      setGoal(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load career goals.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoadmap = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/advisor/roadmap");
      setRoadmap(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load roadmap.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/career/recommendations");
      setProjects(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInterview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/career/interview-prep");
      setInterview(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load interview prep.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "goals") loadGoals();
    else if (tab === "roadmap") loadRoadmap();
    else if (tab === "projects") loadProjects();
    else if (tab === "interview") loadInterview();
  }, [tab]);

  const tabs = [
    { id: "goals" as MainTab, label: "Career Goals", icon: Target },
    { id: "roadmap" as MainTab, label: "Skill Gap & Roadmap", icon: TrendingUp },
    { id: "projects" as MainTab, label: "AI Project Ideas", icon: Code2 },
    { id: "interview" as MainTab, label: "Interview Prep", icon: MessageSquare },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
            <div className="mb-4">
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Skill Gap &amp; Career Growth
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Track goals, close skill gaps, and prepare for interviews.</p>
            </div>
            <div className="flex gap-1 flex-wrap">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      tab === t.id ? "bg-violet-500/20 text-violet-200 border border-violet-500/40" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                    }`}>
                    <Icon className="h-3.5 w-3.5" />{t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex flex-col items-center py-16 gap-3">
                <Cpu className="h-8 w-8 text-emerald-400 animate-spin" />
                <p className="text-slate-400 text-sm">Loading…</p>
              </div>
            )}

            {!loading && error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300">{error}</p>
                  {error.includes("resume") && (
                    <Link href="/resume" className="text-xs text-violet-400 hover:underline mt-1 inline-block">
                      Upload Resume →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {tab === "goals" && !loading && !error && goal && (
              <GoalsEditor goal={goal} onSaved={loadGoals} />
            )}

            {/* Roadmap Tab */}
            {tab === "roadmap" && !loading && !error && roadmap && (
              <div className="space-y-6 max-w-3xl">
                {/* Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: "Target Role", value: roadmap.target_role, color: "text-violet-300" },
                    { label: "Domain", value: roadmap.target_domain, color: "text-cyan-300" },
                    { label: "Skill Gap Score", value: `${roadmap.skill_gap_score || 0}%`, color: "text-emerald-300" },
                  ].map(stat => (
                    <div key={stat.label} className="glass-card rounded-xl border border-slate-800 p-4 text-center">
                      <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Matched vs Missing */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl border border-emerald-500/20 p-5">
                    <h3 className="font-bold text-emerald-300 mb-3 text-sm">✓ Skills You Have ({(roadmap.matched_skills || []).length})</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(roadmap.matched_skills || []).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">{s}</span>
                      ))}
                      {(roadmap.matched_skills || []).length === 0 && <p className="text-xs text-slate-500">Upload resume to see matched skills.</p>}
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl border border-rose-500/20 p-5">
                    <h3 className="font-bold text-rose-300 mb-3 text-sm">△ Skills to Learn ({(roadmap.missing_skills || []).length})</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(roadmap.missing_skills || []).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">{s}</span>
                      ))}
                      {(roadmap.missing_skills || []).length === 0 && <p className="text-xs text-slate-500">No missing skills found.</p>}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {(roadmap.improvement_suggestions || []).length > 0 && (
                  <div className="glass-card rounded-2xl border border-slate-800 p-5">
                    <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-400" /> Improvement Suggestions
                    </h3>
                    <ul className="space-y-2">
                      {(roadmap.improvement_suggestions || []).map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <ChevronRight className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Learning Roadmap */}
                {(roadmap.learning_roadmap || []).length > 0 && (
                  <div className="glass-card rounded-2xl border border-slate-800 p-5">
                    <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-400" /> Learning Roadmap
                    </h3>
                    <div className="space-y-3">
                      {(roadmap.learning_roadmap || []).map((item: any, i: number) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-[10px] font-bold text-violet-300">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.skill || item}</p>
                            {item.resource && <a href={item.resource} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline">Resource ↗</a>}
                            {item.duration && <span className="text-[10px] text-slate-500 ml-2">{item.duration}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Projects Tab */}
            {tab === "projects" && !loading && !error && projects && (
              <div className="space-y-4 max-w-3xl">
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-xs text-violet-300">
                    <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                    AI-generated project ideas based on your resume skills and career goals.
                    {projects.learning_path_note && ` ${projects.learning_path_note}`}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(projects.projects || []).map((p: any, i: number) => (
                    <div key={i} className="glass-card rounded-2xl border border-slate-800 p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-sm">{p.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-semibold ${
                          p.difficulty === "Beginner" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                          p.difficulty === "Intermediate" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}>{p.difficulty}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {(p.skills_practiced || []).map((s: string) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">~{p.estimated_hours}h</span>
                        <Link href="/skill-gap" onClick={() => setTab("goals")}
                          className="text-xs text-violet-400 hover:underline flex items-center gap-1">
                          Add to Portfolio <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={loadProjects} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition">
                  <RefreshCw className="h-4 w-4" /> Regenerate ideas
                </button>
              </div>
            )}

            {/* Interview Prep Tab */}
            {tab === "interview" && !loading && !error && interview && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-white text-lg">{interview.target_role} Interview Prep</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Based on your resume skills: {(interview.skills_covered || []).slice(0, 5).join(", ")}
                    </p>
                  </div>
                  <button onClick={loadInterview} className="text-slate-500 hover:text-slate-300 transition">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {(interview.questions || []).map((q: any, i: number) => (
                    <div key={i} className="glass-card rounded-2xl border border-slate-800 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          q.category === "Technical" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                          q.category === "Behavioral" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                          q.category === "System Design" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          "bg-slate-700 text-slate-300 border border-slate-600"
                        }`}>{q.category}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          q.difficulty === "Hard" ? "bg-rose-500/20 text-rose-300" :
                          q.difficulty === "Medium" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                        }`}>{q.difficulty}</span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-2">{q.question}</p>
                      {q.hint && (
                        <p className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-3">
                          💡 {q.hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
