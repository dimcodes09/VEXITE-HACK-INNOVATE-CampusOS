"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Info
} from "lucide-react";

export type ConflictItem = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  reasoningChain: string;
  policyCitation: string | null;
  relatedEventIds?: string[];
  suggestedAction: string;
  draftableResolution?: boolean;
};

interface ConflictCardListProps {
  conflicts: ConflictItem[];
}

export default function ConflictCardList({ conflicts }: ConflictCardListProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [conflicts[0]?.id || "0"]: true
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSeverityStyle = (severity: ConflictItem["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          border: "border-l-4 border-l-rose-500 border-slate-200",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          label: "CRITICAL CONFLICT",
          icon: ShieldAlert
        };
      case "high":
        return {
          border: "border-l-4 border-l-orange-500 border-slate-200",
          badge: "bg-orange-50 text-orange-800 border-orange-200",
          label: "HIGH SEVERITY",
          icon: AlertTriangle
        };
      case "medium":
        return {
          border: "border-l-4 border-l-amber-500 border-slate-200",
          badge: "bg-amber-50 text-amber-800 border-amber-200",
          label: "MODERATE RISK",
          icon: AlertTriangle
        };
      case "low":
      default:
        return {
          border: "border-l-4 border-l-emerald-500 border-slate-200",
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
          label: "MINOR CONFLICT",
          icon: Info
        };
    }
  };

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="card-panel-elevated rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-900">
          No Policy Conflicts Detected
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Gemini examined all uploaded academic documents against the college policy circular. All attendance figures, submissions, and deadlines satisfy institutional criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
            Identified Policy Conflicts
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold">
            {conflicts.length}
          </span>
        </div>
        <p className="text-xs font-mono text-slate-400">
          GROUNDED VIA ATLAS RAG
        </p>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict, index) => {
          const isExpanded = !!expandedIds[conflict.id || String(index)];
          const style = getSeverityStyle(conflict.severity);
          const SeverityIcon = style.icon;

          return (
            <div
              key={conflict.id || index}
              className={`card-panel rounded-2xl overflow-hidden transition-all duration-200 ${style.border}`}
            >
              {/* Header: Click to toggle */}
              <button
                type="button"
                onClick={() => toggleExpand(conflict.id || String(index))}
                className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase border ${style.badge}`}
                    >
                      <SeverityIcon className="w-3 h-3" />
                      {style.label}
                    </span>
                    {conflict.relatedEventIds && conflict.relatedEventIds.length > 0 && (
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {conflict.relatedEventIds.length} Linked Event
                        {conflict.relatedEventIds.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {conflict.title}
                  </h3>
                </div>

                <div className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex-shrink-0 transition-transform">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/30">
                  {/* Reasoning Chain */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Agentic Reasoning Chain:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {conflict.reasoningChain}
                    </p>
                  </div>

                  {/* Policy Citation Quote Box */}
                  {conflict.policyCitation && (
                    <div className="relative rounded-xl p-4 bg-indigo-50/60 border border-indigo-200/80 shadow-xs space-y-2">
                      <div className="flex items-center gap-2 text-indigo-800">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">
                          College Policy Grounding Citation:
                        </span>
                      </div>
                      <blockquote className="font-mono text-xs text-slate-800 bg-white p-3 rounded-lg border border-indigo-100 leading-relaxed italic">
                        "{conflict.policyCitation}"
                      </blockquote>
                      <p className="text-[10px] font-mono text-slate-500">
                        SOURCE: Institutional Circular 2026 // Real RAG Retrieval Match
                      </p>
                    </div>
                  )}

                  {/* Suggested Action Box */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0 mt-0.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-900">
                        Suggested Remediation:
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-800">
                        {conflict.suggestedAction}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
