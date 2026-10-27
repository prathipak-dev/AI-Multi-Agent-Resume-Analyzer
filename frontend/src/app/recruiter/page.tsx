"use client";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Users, Edit3, Eye, EyeOff, Github, Linkedin, Globe,
  CheckCircle, Clock, XCircle, UserPlus, Send, Cpu,
  ArrowRight, Briefcase, Star
} from "lucide-react";
import { api } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

type Tab = "profile" | "discover" | "connections";

interface Candidate {
  user_id: string;
  full_name: string;
  target_role: string;
  headline: string;
  bio: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  available_for: string;
  skills: string[];
  domain: string;
  ats_score: number;
  connection_status: string | null;
}

function ProfileForm({ profile, user, onSave }: { profile: any; user: any; onSave: () => void }) {
  const [form, setForm] = useState({
    headline: profile?.headline || "",
    bio: profile?.bio || "",
    github_url: profile?.github_url || "",
    linkedin_url: profile?.linkedin_url || "",
    portfolio_url: profile?.portfolio_url || "",
    available_for: profile?.available_for || "Full-time, Internship",
    is_visible: profile?.is_visible ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/recruiter/profile/me", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
        <div className={`w-3 h-3 rounded-full ${form.is_visible ? "bg-emerald-400" : "bg-slate-600"}`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{form.is_visible ? "Visible to others" : "Profile hidden"}</p>
          <p className="text-xs text-slate-400">
            {form.is_visible ? "Other platform users can discover your profile." : "Your profile is private and not discoverable."}
          </p>
        </div>
        <button onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${form.is_visible ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-700 text-slate-400 border border-slate-600"}`}>
          {form.is_visible ? <><Eye className="h-3 w-3 inline mr-1" />Visible</> : <><EyeOff className="h-3 w-3 inline mr-1" />Hidden</>}
        </button>
      </div>

      <div className="grid gap-3">
        <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
          placeholder="Headline (e.g., Full Stack Developer | Open to opportunities)"
          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60" />
        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Short bio — tell potential collaborators or recruiters about yourself…"
          rows={4}
          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 resize-none" />

        <div className="grid md:grid-cols-3 gap-3">
          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input value={form.github_url} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
              placeholder="github.com/username"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60" />
          </div>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              placeholder="linkedin.com/in/name"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60" />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input value={form.portfolio_url} onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))}
              placeholder="portfolio.com"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60" />
          </div>
        </div>

        <select value={form.available_for} onChange={e => setForm(f => ({ ...f, available_for: e.target.value }))}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none">
          <option value="Full-time">Full-time only</option>
          <option value="Internship">Internship only</option>
          <option value="Full-time, Internship">Full-time & Internship</option>
          <option value="Freelance">Freelance</option>
          <option value="Not available">Not currently available</option>
        </select>
      </div>

      <button onClick={save} disabled={saving}
        className="gradient-button px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50 transition">
        {saving ? <><Cpu className="h-4 w-4 animate-spin" />Saving…</> : saved ? <><CheckCircle className="h-4 w-4" />Saved!</> : "Save Profile"}
      </button>
    </div>
  );
}

function CandidateCard({ candidate, onConnect }: { candidate: Candidate; onConnect: (id: string, msg: string) => void }) {
  const [showConnect, setShowConnect] = useState(false);
  const [msg, setMsg] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect(candidate.user_id, msg);
      setShowConnect(false);
    } finally {
      setConnecting(false);
    }
  };

  const status = candidate.connection_status;

  return (
    <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-white text-sm">{candidate.full_name}</h3>
          <p className="text-xs text-slate-400">{candidate.target_role}</p>
          {candidate.headline && <p className="text-xs text-violet-300 mt-1 italic">{candidate.headline}</p>}
        </div>
        {candidate.ats_score && (
          <div className="text-center flex-shrink-0">
            <div className={`text-lg font-black ${candidate.ats_score >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
              {candidate.ats_score}%
            </div>
            <div className="text-[9px] text-slate-500">ATS</div>
          </div>
        )}
      </div>

      {candidate.bio && (
        <p className="text-xs text-slate-400 line-clamp-2">{candidate.bio}</p>
      )}

      {candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.skills.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {candidate.available_for && (
          <span className="text-[10px] text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            {candidate.available_for}
          </span>
        )}
        {candidate.github_url && (
          <a href={candidate.github_url.startsWith("http") ? candidate.github_url : `https://${candidate.github_url}`}
            target="_blank" rel="noreferrer"
            className="text-slate-500 hover:text-slate-300 transition">
            <Github className="h-4 w-4" />
          </a>
        )}
        {candidate.linkedin_url && (
          <a href={candidate.linkedin_url.startsWith("http") ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}
            target="_blank" rel="noreferrer"
            className="text-slate-500 hover:text-blue-400 transition">
            <Linkedin className="h-4 w-4" />
          </a>
        )}
      </div>

      <div>
        {!status && !showConnect && (
          <button onClick={() => setShowConnect(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition">
            <UserPlus className="h-3.5 w-3.5" /> Connect
          </button>
        )}
        {showConnect && (
          <div className="space-y-2">
            <textarea value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="Add a short message (optional)…"
              rows={2}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none" />
            <div className="flex gap-2">
              <button onClick={handleConnect} disabled={connecting}
                className="flex-1 gradient-button py-2 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1">
                {connecting ? <Cpu className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                {connecting ? "Sending…" : "Send Request"}
              </button>
              <button onClick={() => setShowConnect(false)} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}
        {status === "pending" && (
          <div className="text-center text-xs text-amber-400 flex items-center justify-center gap-1 py-2">
            <Clock className="h-3.5 w-3.5" /> Request sent
          </div>
        )}
        {status === "accepted" && (
          <div className="text-center text-xs text-emerald-400 flex items-center justify-center gap-1 py-2">
            <CheckCircle className="h-3.5 w-3.5" /> Connected
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecruiterPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [myProfile, setMyProfile] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [connections, setConnections] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/recruiter/profile/me");
      setMyProfile(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/recruiter/candidates");
      setCandidates(res.data.candidates || []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/recruiter/connections");
      setConnections(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "profile") loadProfile();
    else if (tab === "discover") loadCandidates();
    else if (tab === "connections") loadConnections();
  }, [tab, loadProfile, loadCandidates, loadConnections]);

  const handleConnect = async (targetId: string, message: string) => {
    await api.post("/recruiter/connect", { target_user_id: targetId, message });
    setCandidates(prev => prev.map(c =>
      c.user_id === targetId ? { ...c, connection_status: "pending" } : c
    ));
  };

  const handleRespond = async (connId: string, action: "accept" | "decline") => {
    await api.post("/recruiter/connections/respond", { connection_id: connId, action });
    loadConnections();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "My Profile" },
    { id: "discover", label: "Discover Candidates" },
    { id: "connections", label: `Connections${connections?.pending_received ? ` (${connections.pending_received})` : ""}` },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
            <div className="mb-4">
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                Recruiter Connect
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Control your visibility, discover candidates, and manage connections — all within the platform.
              </p>
            </div>
            <div className="flex gap-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    tab === t.id ? "bg-violet-500/20 text-violet-200 border border-violet-500/40" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Cpu className="h-8 w-8 text-cyan-400 animate-spin" />
              </div>
            )}

            {!loading && error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
            )}

            {/* My Profile Tab */}
            {tab === "profile" && !loading && myProfile && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl border border-slate-800 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm">
                      {(myProfile.user?.full_name || "U").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{myProfile.user?.full_name}</h3>
                      <p className="text-xs text-slate-400">{myProfile.user?.email} · {myProfile.user?.target_role}</p>
                    </div>
                  </div>
                  {myProfile.resume_summary?.has_resume && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(myProfile.resume_summary?.skills || []).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">{s}</span>
                      ))}
                    </div>
                  )}
                  {!myProfile.resume_summary?.has_resume && (
                    <p className="text-xs text-amber-400 mt-2">⚠ Upload your resume to show skills on your profile.</p>
                  )}
                </div>

                <div className="glass-card rounded-2xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white mb-4">Edit Profile</h3>
                  <ProfileForm profile={myProfile.profile} user={myProfile.user} onSave={loadProfile} />
                </div>
              </div>
            )}

            {/* Discover Tab */}
            {tab === "discover" && !loading && (
              <>
                {candidates.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Users className="h-12 w-12 text-slate-600 mx-auto" />
                    <p className="text-slate-400 font-semibold">No other visible candidates yet.</p>
                    <p className="text-xs text-slate-500">Encourage other users to set their profile to visible.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {candidates.map(c => (
                      <CandidateCard key={c.user_id} candidate={c} onConnect={handleConnect} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Connections Tab */}
            {tab === "connections" && !loading && connections && (
              <div className="space-y-6 max-w-2xl">
                {connections.received.filter((c: any) => c.status === "pending").length > 0 && (
                  <div>
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-400" />
                      Pending Requests ({connections.received.filter((c: any) => c.status === "pending").length})
                    </h3>
                    <div className="space-y-3">
                      {connections.received.filter((c: any) => c.status === "pending").map((c: any) => (
                        <div key={c.id} className="glass-card rounded-xl border border-amber-500/20 p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{c.other_user?.full_name}</p>
                            <p className="text-xs text-slate-400">{c.other_user?.target_role}</p>
                            {c.message && <p className="text-xs text-slate-500 italic mt-1">"{c.message}"</p>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleRespond(c.id, "accept")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition">
                              Accept
                            </button>
                            <button onClick={() => handleRespond(c.id, "decline")}
                              className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs border border-slate-600 hover:bg-slate-700 transition">
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-white mb-3">Sent Requests ({connections.sent.length})</h3>
                  {connections.sent.length === 0 ? (
                    <p className="text-sm text-slate-500">No sent requests yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {connections.sent.map((c: any) => (
                        <div key={c.id} className="glass-card rounded-xl border border-slate-800 p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white font-medium">{c.other_user?.full_name}</p>
                            <p className="text-xs text-slate-400">{c.other_user?.target_role}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                            c.status === "accepted" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                            c.status === "declined" ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                            "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>{c.status}</span>
                        </div>
                      ))}
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
