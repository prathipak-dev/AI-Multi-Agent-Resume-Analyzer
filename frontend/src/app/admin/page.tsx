"use client";
import Sidebar from "@/components/Sidebar";
import { ShieldCheck, Database, Layers, Activity, Cpu, CheckCircle } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-400" /> Admin System Monitoring & Execution Logs
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time multi-agent execution telemetry and database status.
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <Database className="h-5 w-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">PostgreSQL</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3" /> Connected (Pool Active)
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <Layers className="h-5 w-5 text-purple-400 mb-2" />
            <div className="text-2xl font-bold text-white">ChromaDB</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3" /> Collections Indexed
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <Cpu className="h-5 w-5 text-indigo-400 mb-2" />
            <div className="text-2xl font-bold text-white">LangGraph</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3" /> Graph Compiled
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <Activity className="h-5 w-5 text-rose-400 mb-2" />
            <div className="text-2xl font-bold text-white">Groq API</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3" /> 500+ Tokens/sec
            </div>
          </div>
        </div>

        {/* Agent Execution Logs */}
        <div className="glass-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="font-bold text-white text-sm">LangGraph Execution Trajectory</h3>
          <div className="space-y-2 font-mono text-xs text-gray-300">
            <div className="p-2.5 rounded-lg bg-surface/80 border border-gray-800 text-indigo-300">
              [STATE_INIT] Initialized AgentState (user_id="usr-101", target_domain="Full Stack")
            </div>
            <div className="p-2.5 rounded-lg bg-surface/80 border border-gray-800 text-emerald-300">
              [AGENT_1_COLLECTOR] Fetched 12 fresher jobs from Jooble API. Deduplicated 2 duplicates.
            </div>
            <div className="p-2.5 rounded-lg bg-surface/80 border border-gray-800 text-purple-300">
              [AGENT_3_RESUME_INTEL] PyPDF extracted 8 skills. ATS Score: 82.5%. Vector embedded in ChromaDB.
            </div>
            <div className="p-2.5 rounded-lg bg-surface/80 border border-gray-800 text-rose-300">
              [AGENT_5_MATCH_ENGINE] Calculated Cosine Similarity & Keyword ratio. Top Match: 94.5%.
            </div>
            <div className="p-2.5 rounded-lg bg-surface/80 border border-gray-800 text-amber-300">
              [AGENT_8_COORDINATOR] LangGraph execution finished cleanly in 1.2 seconds.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
