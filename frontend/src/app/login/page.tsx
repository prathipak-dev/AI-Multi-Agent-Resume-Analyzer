"use client";
import { useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("demo@test.com");
  const [password, setPassword] = useState("demo123456");
  const [fullName, setFullName] = useState("Demo Candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        const res = await api.post("/auth/register", {
          email,
          password,
          full_name: fullName,
          target_role: "Full Stack Developer",
        });
        localStorage.setItem("access_token", res.data.access_token);
      } else {
        const res = await api.post("/auth/login", {
          email,
          password,
        });
        localStorage.setItem("access_token", res.data.access_token);
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden px-6 py-10">
      <div className="hero-orb left-[-100px] top-20 h-72 w-72 bg-violet-600/25" />
      <div className="hero-orb right-[-40px] top-32 h-72 w-72 bg-cyan-500/20" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-800/80 bg-slate-950/70 shadow-[0_30px_80px_rgba(15,23,42,0.85)] backdrop-blur-xl lg:grid-cols-[1fr_0.95fr]">
        <div className="hidden bg-gradient-to-br from-violet-700/30 via-slate-950 to-cyan-500/20 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              Career signal
            </div>
            <h1 className="mt-6 max-w-sm text-4xl font-black tracking-[-0.06em] text-white">
              Your next move starts with better signal.
            </h1>
          </div>

          <div className="space-y-3 text-sm text-slate-200">
            {[
              "Structured skill benchmarking",
              "ATS-aligned resume intelligence",
              "Personalized job matching",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/50 p-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] text-white">
              {isRegister ? "Create account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Access the AI Career Intelligence platform
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gradient-button mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Processing..." : isRegister ? "Create account" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="font-medium text-violet-300 transition hover:text-violet-200"
            >
              {isRegister ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
