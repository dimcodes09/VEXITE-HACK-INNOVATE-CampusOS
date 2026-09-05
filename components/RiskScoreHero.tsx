"use client";

import React from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Zap,
  Clock,
  BookOpen,
  Activity,
  Layers
} from "lucide-react";

interface RiskScoreHeroProps {
  riskScore: number;
  topAction: string;
  generatedAt?: string | Date;
  onRefresh: () => void;
  isRefreshing?: boolean;
  conflictCount?: number;
  eventCount?: number;
}

export default function RiskScoreHero({
  riskScore,
  topAction,
  generatedAt,
  onRefresh,
  isRefreshing = false,
  conflictCount = 0,
  eventCount = 0
}: RiskScoreHeroProps) {
  const getRiskDetails = (score: number) => {
    if (score >= 80) {
      return {
        level: "CRITICAL RISK",
        sublabel: "DEBARMENT / PENALTY IMMINENT",
        color: "#E11D48",
        textColor: "text-rose-600",
        bgBadge: "bg-rose-50 text-rose-700 border-rose-200",
        ringColor: "#E11D48",
        icon: ShieldAlert
      };
    }
    if (score >= 60) {
      return {
        level: "HIGH RISK",
        sublabel: "POLICY THRESHOLD VIOLATION",
        color: "#EA580C",
        textColor: "text-orange-600",
        bgBadge: "bg-orange-50 text-orange-800 border-orange-200",
        ringColor: "#EA580C",
        icon: AlertTriangle
      };
    }
    if (score >= 30) {
      return {
        level: "ELEVATED RISK",
        sublabel: "MULTIPLE CLASHES IDENTIFIED",
        color: "#D97706",
        textColor: "text-amber-600",
        bgBadge: "bg-amber-50 text-amber-800 border-amber-200",
        ringColor: "#D97706",
        icon: AlertTriangle
      };
    }
    return {
      level: "NOMINAL RISK",
      sublabel: "ACADEMIC RULES SATISFIED",
      color: "#059669",
      textColor: "text-emerald-600",
      bgBadge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      ringColor: "#059669",
      icon: ShieldCheck
    };
  };

  const risk = getRiskDetails(riskScore);
  const StatusIcon = risk.icon;

  const size = 190;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(Math.max(riskScore, 0), 100) / 100) * circumference;

  const formattedTime = generatedAt
    ? new Date(generatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Clean White Hero Card */}
      <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 transition-all duration-300">
        {/* Top telemetry status bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: risk.color }}
            />
            <span className="font-mono text-xs text-slate-700 tracking-wider font-bold uppercase">
              INSTITUTIONAL RISK RADAR // DIT CORE
            </span>
          </div>

          <div className="flex items-center gap-3">
            {formattedTime && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                LAST INVESTIGATED: <strong className="text-slate-700 font-semibold">{formattedTime}</strong>
              </span>
            )}

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs hover:scale-[1.02]"
              title="Re-run agentic risk investigation"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
              />
              <span>{isRefreshing ? "Investigating..." : "Re-Investigate"}</span>
            </button>
          </div>
        </div>

        {/* Center Hero: Monolithic Risk Metric + Radial Gauge */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 py-6">
          {/* Dominant Gauge Arc */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Active Colored Meter */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={risk.ringColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Central Score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                RISK INDEX
              </span>
              <span
                className={`font-display text-5xl sm:text-6xl font-black tracking-tighter ${risk.textColor} leading-none my-1`}
              >
                {riskScore}
              </span>
              <span className="font-mono text-xs text-slate-400 font-semibold">
                / 100
              </span>
            </div>
          </div>

          {/* Risk Classification & Top Action Directive */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${risk.bgBadge}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {risk.level}
              </span>
              <span className="text-xs font-mono text-slate-500 font-medium">
                // {risk.sublabel}
              </span>
            </div>

            {/* Dominant Top Action Sentence — Directive Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white border border-indigo-100/90 relative overflow-hidden shadow-xs group">
              <div
                className="absolute left-0 top-0 bottom-0 w-2"
                style={{ backgroundColor: risk.color }}
              />
              <div className="space-y-1.5 pl-3">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-indigo-700">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  HIGHEST-LEVERAGE ACTION (DO THIS NOW):
                </div>
                <p className="text-base sm:text-lg font-display font-bold text-slate-900 leading-snug">
                  {topAction ||
                    "Drop your timetable, syllabus, or notice in the ingestion zone to start autonomous risk investigation."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Telemetry Metrics Strip (CampusMart info cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
              Severity Status
            </span>
            <p className="text-sm font-semibold text-slate-900 uppercase">
              {risk.level.split(" ")[0]}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
              Policy Conflicts
            </span>
            <p className="text-sm font-semibold text-rose-600">
              {conflictCount} Flagged
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
              Cataloged Events
            </span>
            <p className="text-sm font-semibold text-indigo-600">
              {eventCount} Extracted
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
              Grounding Engine
            </span>
            <p className="text-sm font-semibold text-emerald-600">
              Gemini 3.6 RAG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
