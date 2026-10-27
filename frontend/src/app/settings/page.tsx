"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Settings as SettingsIcon, Save, Key, User, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [groqKey, setGroqKey] = useState("gsk_********************************");
  const [joobleKey, setJoobleKey] = useState("jbl_****************");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-indigo-400" /> Platform Settings & Environment API Keys
          </h1>
          <p className="text-xs text-gray-400 mt-1">Configure Groq LLM model and Jooble Job API keys.</p>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            Settings & API configuration saved successfully!
          </div>
        )}

        <div className="glass-card p-6 rounded-2xl border border-gray-800 max-w-2xl">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400" /> Groq API Key (Primary LLM Engine)
              </label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full bg-surface border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-300 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">Powers Llama-3.3-70b zero-shot parsing & interview generation.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-400" /> Jooble API Key (Job Search Data Source)
              </label>
              <input
                type="password"
                value={joobleKey}
                onChange={(e) => setJoobleKey(e.target.value)}
                className="w-full bg-surface border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-300 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">Queries fresher job postings from Jooble API.</p>
            </div>

            <button
              type="submit"
              className="gradient-button text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 text-xs shadow-lg"
            >
              <Save className="h-4 w-4" /> Save Configuration
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
