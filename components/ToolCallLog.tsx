"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Cpu, Calendar, UserCheck, ShieldCheck, Search } from "lucide-react";

export type ToolCallEntry = {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

interface ToolCallLogProps {
  toolCallLog?: ToolCallEntry[];
}

export default function ToolCallLog({ toolCallLog = [] }: ToolCallLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(0);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "get_upcoming_events":
        return Calendar;
      case "get_attendance_status":
        return UserCheck;
      case "get_policy_clause":
        return ShieldCheck;
      default:
        return Search;
    }
  };

  const getToolDescription = (toolName: string, input: Record<string, unknown>) => {
    switch (toolName) {
      case "get_upcoming_events":
        return `Queried upcoming events within ${input.daysAhead ?? 14} days window`;
      case "get_attendance_status":
        return input.subject
          ? `Verified attendance metrics for course: ${input.subject}`
          : "Retrieved course-wise attendance ledger";
      case "get_policy_clause":
        return `Semantic RAG retrieval on policy clause: "${input.topic ?? "academic rules"}"`;
      default:
        return `Invoked autonomous tool: ${toolName}`;
    }
  };

  return (
    <div className="card-panel rounded-2xl overflow-hidden transition-all">
      {/* Transparency Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Agentic Investigation Trace
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold">
                {toolCallLog.length} Tool Calls
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Transparency Log: How Gemini autonomously gathered evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="hidden sm:inline">
            {isOpen ? "Hide Trace" : "Inspect Trace"}
          </span>
          <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>

      {/* Expanded Timeline & Raw Tool Inspection */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 space-y-4 font-mono text-xs">
          {toolCallLog.length === 0 ? (
            <p className="text-slate-500 italic py-2 text-center font-sans">
              No tool calls recorded in latest session. Re-run investigation to view live function calling trace.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Step Sequence Timeline */}
              <div className="space-y-2">
                {toolCallLog.map((entry, idx) => {
                  const Icon = getToolIcon(entry.tool);
                  const isSelected = selectedToolIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedToolIndex(isSelected ? null : idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white border-indigo-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                            {idx + 1}
                          </span>
                          <Icon className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-slate-900">
                            gemini.{entry.tool}()
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isSelected ? "Collapse" : "Inspect"}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1.5 pl-7 font-sans">
                        {getToolDescription(entry.tool, entry.input)}
                      </p>

                      {/* Expanded Payload Inspector */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 pl-7">
                          <div>
                            <span className="text-[10px] text-indigo-700 uppercase font-semibold">
                              Tool Arguments (Input):
                            </span>
                            <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto text-[11px] mt-1">
                              {JSON.stringify(entry.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-700 uppercase font-semibold">
                              Retrieved Data (Output):
                            </span>
                            <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto text-[11px] mt-1 max-h-48">
                              {JSON.stringify(entry.output, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
