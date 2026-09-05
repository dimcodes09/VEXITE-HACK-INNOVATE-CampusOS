"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Play,
  Loader2,
  Clock,
  BookOpen,
  ArrowRight,
  Info,
  CalendarDays,
  Cpu,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";

interface TrajectoryDay {
  day: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  note: string;
}

interface SimulationData {
  projectedRiskScore: number;
  projectedTrajectory: TrajectoryDay[];
  reasoning: string;
  policyCitations: string[];
}

interface ConsequenceSimulatorProps {
  currentRiskScore: number;
  fullPageView?: boolean;
}

export default function ConsequenceSimulator({
  currentRiskScore,
  fullPageView = false
}: ConsequenceSimulatorProps) {
  const [hypothetical, setHypothetical] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationData | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(0);

  const presets = [
    {
      title: "Skip Hackathon for Classes",
      query: "What if I skip the SIH hackathon to attend DBMS classes?",
      desc: "Tests attendance recovery vs missing national event credit"
    },
    {
      title: "Attend Hackathon Without Sanction",
      query: "What if I attend the hackathon without prior HOD sanction?",
      desc: "Tests unapproved leave debarment rules under Section 2"
    },
    {
      title: "Submit Assignment 48h Late",
      query: "What if I submit my DBMS assignment 48 hours late?",
      desc: "Tests 25% mark deduction policy under Section 3"
    },
    {
      title: "Miss Thursday Assessment",
      query: "What if I miss the upcoming Thursday internal assessment?",
      desc: "Tests 16/40 internal cutoff and makeup policy"
    }
  ];

  const handleRunSimulation = async (queryText?: string) => {
    const textToSimulate = queryText || hypothetical;
    if (!textToSimulate.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedDayIndex(0);

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothetical: textToSimulate.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Simulation engine returned an error");
      }

      setResult(data);
      if (queryText) {
        setHypothetical(queryText);
      }
    } catch (err: any) {
      setError(err.message || "Failed to project consequence trajectory");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: TrajectoryDay["riskLevel"]) => {
    switch (level) {
      case "critical":
        return {
          bg: "bg-rose-500",
          bgSubtle: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-700"
        };
      case "high":
        return {
          bg: "bg-orange-500",
          bgSubtle: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-800"
        };
      case "medium":
        return {
          bg: "bg-amber-500",
          bgSubtle: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-800"
        };
      case "low":
      default:
        return {
          bg: "bg-emerald-500",
          bgSubtle: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-800"
        };
    }
  };

  const scoreDelta = result ? result.projectedRiskScore - currentRiskScore : 0;

  return (
    <div className={`space-y-6 ${fullPageView ? "max-w-5xl mx-auto" : ""}`}>
      {/* Top Banner if Full Page */}
      {fullPageView && (
        <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold">
              <Cpu className="w-3.5 h-3.5" />
              PREDICTIVE CONSEQUENCE SIMULATOR
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Replay The Future Before You Decide
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Simulate skipping a class, participating in an external hackathon, or delaying an assignment. Gemini calculates the downstream policy trajectory over the coming 7 days.
            </p>
          </div>
          <div className="w-full md:w-64 h-36 rounded-2xl overflow-hidden border border-slate-200 relative flex-shrink-0 shadow-sm">
            <img
              src="/assets/future_consequence_timeline.jpg"
              alt="Quantum Simulation"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                Hypothetical Decision Lab
              </h2>
              <p className="text-xs font-mono text-slate-500">
                POLICY-GROUNDED DOWNSTREAM TRAJECTORY REPLAY
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wide">
            Predictive Model
          </span>
        </div>

        {/* Input Box & Trigger */}
        <div className="space-y-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={hypothetical}
              onChange={(e) => setHypothetical(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleRunSimulation();
                }
              }}
              placeholder="Type a hypothetical decision (e.g. 'what if I skip the SIH hackathon to attend DBMS classes?')..."
              className="w-full pl-4 pr-32 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-sans focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => handleRunSimulation()}
              disabled={loading || !hypothetical.trim()}
              className="absolute right-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{loading ? "Simulating..." : "Simulate"}</span>
            </button>
          </div>

          {/* Quick Scenario Preset Cards */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-700 font-bold uppercase tracking-wider">
              Quick Decision Scenarios:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRunSimulation(preset.query)}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all cursor-pointer group shadow-xs"
                >
                  <span className="text-xs font-semibold text-indigo-700 block truncate">
                    {preset.title}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Output */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Simulation Result Area: Day-by-Day Replay Strip */}
        {result && (
          <div className="pt-6 border-t border-slate-200 space-y-6 animate-fade-in">
            {/* Projected Risk Comparison Badge */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Projected Downstream Risk Score
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-display text-4xl sm:text-5xl font-black text-slate-900">
                    {result.projectedRiskScore}
                  </span>
                  <span className="text-sm font-mono text-slate-400 font-semibold">/ 100</span>
                </div>
              </div>

              {/* Score Delta */}
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold border shadow-xs ${
                  scoreDelta > 0
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : scoreDelta < 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {scoreDelta > 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-rose-600" />
                    <span>+{scoreDelta} RISK SURGE</span>
                  </>
                ) : scoreDelta < 0 ? (
                  <>
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                    <span>{scoreDelta} RISK REDUCTION</span>
                  </>
                ) : (
                  <span>NO SCORE VARIATION</span>
                )}
              </div>
            </div>

            {/* Day-by-Day Horizontal Trajectory Strip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-700">
                <span className="flex items-center gap-2 font-bold uppercase">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  7-Day Projected Timeline (Click Day Node to Inspect)
                </span>
                <span className="text-slate-400">{result.projectedTrajectory.length} Nodes</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {result.projectedTrajectory.map((item, idx) => {
                  const color = getRiskColor(item.riskLevel);
                  const isSelected = selectedDayIndex === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-24 shadow-xs ${
                        isSelected
                          ? `${color.bgSubtle} ${color.border} ring-2 ring-indigo-500 scale-[1.03] shadow-md`
                          : "bg-white border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                          {item.day}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                      </div>

                      <div className="space-y-1">
                        <span className={`font-mono text-[10px] uppercase font-bold tracking-wider ${color.text}`}>
                          {item.riskLevel}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-tight">
                          {item.note}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Day Inspection Note */}
            {selectedDayIndex !== null && result.projectedTrajectory[selectedDayIndex] && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-indigo-900 uppercase">
                    {result.projectedTrajectory[selectedDayIndex].day} Deep Breakdown:
                  </span>
                  <span
                    className={`text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      getRiskColor(result.projectedTrajectory[selectedDayIndex].riskLevel).bgSubtle
                    } ${getRiskColor(result.projectedTrajectory[selectedDayIndex].riskLevel).text} ${
                      getRiskColor(result.projectedTrajectory[selectedDayIndex].riskLevel).border
                    }`}
                  >
                    {result.projectedTrajectory[selectedDayIndex].riskLevel} Severity
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {result.projectedTrajectory[selectedDayIndex].note}
                </p>
              </div>
            )}

            {/* Grounded Reasoning */}
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Simulation Rationale:
              </span>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed p-4 rounded-xl bg-slate-50 border border-slate-200">
                {result.reasoning}
              </p>
            </div>

            {/* Policy Citations Used */}
            {result.policyCitations && result.policyCitations.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="font-mono text-xs uppercase font-bold text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Invoked Institutional Policies:
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.policyCitations.map((citation, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-900 shadow-xs"
                    >
                      "{citation}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
