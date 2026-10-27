"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import {
  Layout, CheckCircle2, Download, Eye, Star,
  Briefcase, GraduationCap, Code, Database, Layers, User
} from "lucide-react";

// ─────────────────────────────────────────────
// Template definitions
// ─────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "ats-clean",
    name: "ATS Clean",
    tag: "Recommended",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    description: "Single column, no graphics. Maximum ATS compatibility. Best for most roles.",
    bestFor: ["All roles", "ATS-first companies", "Applicant tracking systems"],
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    accentColor: "border-emerald-500/30",
    preview: {
      sections: ["Contact", "Summary", "Experience", "Education", "Skills"],
      columns: 1,
      hasPhoto: false,
      fontStyle: "Classic serif headers",
    }
  },
  {
    id: "student-fresh",
    name: "Student / Fresher",
    tag: "Entry Level",
    tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    description: "Highlights education, projects, and internships prominently. Ideal for new graduates.",
    bestFor: ["College students", "Fresh graduates", "First internship"],
    icon: GraduationCap,
    iconColor: "text-blue-400",
    accentColor: "border-blue-500/30",
    preview: {
      sections: ["Contact", "Education", "Projects", "Skills", "Certifications"],
      columns: 1,
      hasPhoto: false,
      fontStyle: "Modern sans-serif",
    }
  },
  {
    id: "software-engineer",
    name: "Software Engineer",
    tag: "Tech Roles",
    tagColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    description: "Emphasizes technical stack, GitHub, and project impact. Built for engineering roles.",
    bestFor: ["Backend / Frontend", "Full Stack", "DevOps"],
    icon: Code,
    iconColor: "text-violet-400",
    accentColor: "border-violet-500/30",
    preview: {
      sections: ["Contact + Links", "Summary", "Experience", "Projects", "Skills", "Education"],
      columns: 1,
      hasPhoto: false,
      fontStyle: "Clean monospace accents",
    }
  },
  {
    id: "data-science",
    name: "Data & AI",
    tag: "Data Roles",
    tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    description: "Showcases publications, models, datasets, and analytical tools. Optimized for ML/AI roles.",
    bestFor: ["Data Science", "ML Engineering", "Data Analysis"],
    icon: Database,
    iconColor: "text-amber-400",
    accentColor: "border-amber-500/30",
    preview: {
      sections: ["Contact", "Summary", "Skills (Technical)", "Experience", "Projects / Research", "Education"],
      columns: 1,
      hasPhoto: false,
      fontStyle: "Academic style",
    }
  },
  {
    id: "experienced-pro",
    name: "Senior Professional",
    tag: "5+ Years",
    tagColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    description: "Executive-style layout with leadership, achievements, and strategic impact front and center.",
    bestFor: ["Senior Engineers", "Tech Leads", "Architects"],
    icon: Briefcase,
    iconColor: "text-rose-400",
    accentColor: "border-rose-500/30",
    preview: {
      sections: ["Contact", "Executive Summary", "Core Competencies", "Experience", "Education"],
      columns: 1,
      hasPhoto: false,
      fontStyle: "Premium executive style",
    }
  },
  {
    id: "two-column",
    name: "Two Column Modern",
    tag: "Design-Forward",
    tagColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    description: "Sidebar layout with skills and contact on the left, experience on the right. Visually distinctive.",
    bestFor: ["Startups", "Design-forward companies", "UI/UX roles"],
    icon: Layers,
    iconColor: "text-cyan-400",
    accentColor: "border-cyan-500/30",
    preview: {
      sections: ["Left: Contact, Skills, Education", "Right: Summary, Experience, Projects"],
      columns: 2,
      hasPhoto: false,
      fontStyle: "Contemporary sans-serif",
    },
    warning: "Two-column layouts may not parse correctly in older ATS systems. Use ATS Clean for automated screening."
  },
];

// ─────────────────────────────────────────────
// Resume Preview Component
// ─────────────────────────────────────────────

function ResumePreview({ template }: { template: typeof TEMPLATES[0] }) {
  if (template.preview.columns === 2) {
    return (
      <div className="bg-white rounded-lg p-3 font-sans text-slate-900 h-full overflow-hidden">
        <div className="flex gap-2 h-full">
          <div className="w-1/3 bg-slate-800 rounded p-2 space-y-2">
            <div className="h-8 w-8 rounded-full bg-slate-500 mx-auto" />
            <div className="h-2 bg-slate-600 rounded w-3/4 mx-auto" />
            <div className="h-1.5 bg-slate-700 rounded w-full" />
            <div className="h-1.5 bg-slate-700 rounded w-4/5" />
            <div className="mt-2 space-y-1">
              {[70, 85, 60, 75].map((w, i) => (
                <div key={i} className="h-1.5 bg-cyan-500/60 rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-slate-300 rounded w-full" />
            <div className="h-1.5 bg-slate-200 rounded w-4/5" />
            <div className="mt-2 h-px bg-slate-200" />
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1">
                <div className="h-1.5 bg-slate-700 rounded w-1/2" />
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 font-sans text-slate-900 h-full overflow-hidden">
      {/* Name */}
      <div className="text-center mb-3">
        <div className="h-3 bg-slate-800 rounded w-2/3 mx-auto mb-1" />
        <div className="h-1.5 bg-slate-400 rounded w-1/2 mx-auto" />
      </div>
      {/* Sections */}
      {template.preview.sections.slice(0, 5).map((section, i) => (
        <div key={i} className="mb-2">
          <div className="h-1.5 bg-slate-700 rounded w-1/4 mb-1" />
          <div className="h-px bg-slate-200 mb-1" />
          <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
          <div className="h-1 bg-slate-200 rounded w-4/5" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function TemplatesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Layout className="h-5 w-5 text-violet-400" />
              Resume Templates
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Professional templates for different career stages and roles. ATS-optimized designs.
            </p>
          </div>

          <div className="p-6">
            {/* Info banner */}
            <div className="mb-6 p-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 flex gap-3">
              <Star className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-violet-200 mb-1">Template Recommendation</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start with <strong className="text-emerald-300">ATS Clean</strong> for most applications — especially when applying through online portals.
                  Use visually distinctive templates only when applying directly or to design-forward companies where your PDF will be read by a human first.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TEMPLATES.map(template => {
                const Icon = template.icon;
                const isSelected = selected === template.id;

                return (
                  <div
                    key={template.id}
                    className={`glass-card rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                      isSelected
                        ? `${template.accentColor} ring-1 ring-violet-500/40 shadow-lg shadow-violet-500/10`
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                    onClick={() => setSelected(isSelected ? null : template.id)}
                  >
                    {/* Preview thumbnail */}
                    <div
                      className="h-40 bg-slate-900/60 p-3 border-b border-slate-800/80"
                      onClick={e => { e.stopPropagation(); setPreviewing(template.id); }}
                    >
                      <div className="h-full">
                        <ResumePreview template={template} />
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${template.iconColor}`} />
                          <h3 className="font-bold text-white text-sm">{template.name}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${template.tagColor}`}>
                          {template.tag}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{template.description}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.bestFor.map(use => (
                          <span key={use} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {use}
                          </span>
                        ))}
                      </div>

                      <div className="mb-3">
                        <p className="text-[10px] text-slate-500 mb-1">Sections included:</p>
                        <div className="space-y-0.5">
                          {template.preview.sections.map(s => (
                            <div key={s} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500/60 flex-shrink-0" />
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>

                      {template.warning && (
                        <div className="mb-3 p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[10px] text-amber-300">
                          ⚠ {template.warning}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(template.id); }}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                            isSelected
                              ? "bg-violet-500/30 border border-violet-500/50 text-violet-200"
                              : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isSelected ? "✓ Selected" : "Select"}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setPreviewing(template.id); }}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected template action area */}
            {selected && (() => {
              const tmpl = TEMPLATES.find(t => t.id === selected)!;
              return (
                <div className="mt-6 p-6 glass-card rounded-2xl border border-violet-500/30 bg-violet-500/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Selected: {tmpl.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        To use this template, export your resume content from the Upload page and apply this layout.
                        PDF export will be available in a future update — for now, use the content as a structured guide.
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-200 text-xs font-semibold hover:bg-violet-500/30 transition">
                        <Download className="h-4 w-4" />
                        Download Template Guide
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
