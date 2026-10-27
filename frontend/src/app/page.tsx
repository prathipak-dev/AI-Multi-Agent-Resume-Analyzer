"use client";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const agentCards = [
  { title: "Collector", label: "Fresh job discovery", icon: Database, tint: "text-cyan-300" },
  { title: "Resume Intel", label: "ATS & skill extraction", icon: Cpu, tint: "text-emerald-300" },
  { title: "Match Engine", label: "Vector + keyword scoring", icon: Target, tint: "text-pink-300" },
  { title: "Coordinator", label: "Workflow orchestration", icon: Layers, tint: "text-violet-300" },
];

const featureCards = [
  {
    title: "Career intelligence",
    description: "Live market signals, ATS insights, and opportunity matching tuned for the roles you actually want.",
    icon: BrainCircuit,
    tint: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  },
  {
    title: "Realtime skill radar",
    description: "Track your missing strengths against the job market and prioritize the fastest path to traction.",
    icon: Target,
    tint: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  },
  {
    title: "AI-assisted applications",
    description: "Generate tailored cover letters, email outreach, and resume rewrites in a single click.",
    icon: Zap,
    tint: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div className="hero-orb left-[-120px] top-24 h-64 w-64 bg-violet-500/35" />
      <div className="hero-orb right-10 top-16 h-72 w-72 bg-cyan-500/25" />
      <div className="hero-orb bottom-[-80px] left-1/2 h-80 w-80 -translate-x-1/2 bg-pink-500/20" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-16 md:pt-20">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
          <Sparkles className="h-3.5 w-3.5 text-violet-300" />
          AI career intelligence platform
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.06em] text-white md:text-6xl xl:text-7xl">
              Turn your profile into a
              <span className="gradient-text block">career momentum engine.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Discover the right roles, measure your ATS readiness, close skill gaps fast, and create polished application packages with a multi-agent AI system built for ambitious candidates.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="gradient-button inline-flex items-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg"
              >
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/resume"
                className="glass-card inline-flex items-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-violet-400/40"
              >
                Upload resume
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {[
                "AI matching",
                "ATS scoring",
                "Skill-gap roadmap",
                "Application automation",
              ].map((item) => (
                <span key={item} className="metric-chip rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass-card-glowing relative overflow-hidden rounded-[28px] p-5">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

              <div className="rounded-[22px] border border-white/10 bg-slate-950/60 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Live intelligence</p>
                    <h2 className="mt-2 text-xl font-bold text-white">Opportunity signal</h2>
                  </div>
                  <span className="status-pill">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Active
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Target role", value: "Full Stack Engineer" },
                    { label: "ATS fit", value: "91%" },
                    { label: "Top match score", value: "96.4%" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{item.label}</span>
                        <span className="text-slate-200">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {agentCards.map(({ title, label, icon: Icon, tint }) => (
                    <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                      <Icon className={`h-5 w-5 ${tint}`} />
                      <div className="mt-3 text-sm font-semibold text-white">{title}</div>
                      <div className="mt-1 text-[11px] leading-5 text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">The operating system for job search</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
            Build a sharper, smarter job search loop
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map(({ title, description, icon: Icon, tint }) => (
            <div key={title} className="glass-card rounded-[24px] p-6">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12">
        <div className="glass-card rounded-[28px] border border-violet-500/20 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200">Built to ship faster</p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white md:text-3xl">
                From resume parsing to application packaging, every step feels purposeful.
              </h3>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              Ready for real workflows and real candidates
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-800/90 py-8 text-center text-xs text-slate-400">
        Built for serious career growth • LangGraph • FastAPI • Next.js • Groq • PostgreSQL
      </footer>
    </div>
  );
}
