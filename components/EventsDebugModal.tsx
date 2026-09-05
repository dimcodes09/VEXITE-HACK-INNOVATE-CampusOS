"use client";

import React, { useState, useEffect } from "react";
import { X, Database, RefreshCw, Calendar, Clock, Tag, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface AcademicEvent {
  _id: string;
  type: string;
  title: string;
  subject: string | null;
  startTime: string | null;
  endTime: string | null;
  deadline: string | null;
  location: string | null;
  metadata?: {
    attendancePercent?: number | null;
    estimatedEffortHours?: number | null;
    sourceFileType?: string | null;
  };
  createdAt?: string | null;
}

interface EventsDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventsDebugModal({ isOpen, onClose }: EventsDebugModalProps) {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load events");
      }
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || "Failed to load events ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-5xl max-h-[85vh] rounded-2xl flex flex-col border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-obsidian-border flex items-center justify-between gap-4 bg-obsidian-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-obsidian-800 text-cyan-400 border border-obsidian-border">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">
                  Ingested Academic Events Ledger
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                  {events.length} Records in MongoDB
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                RAW TELEMETRY VIEW // GET /api/events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEvents}
              disabled={loading}
              type="button"
              className="p-2 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 hover:text-white border border-obsidian-border text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-lg bg-obsidian-850 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-obsidian-border transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-slate-400">Querying events collection...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Database className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-sans font-medium">No events cataloged yet.</p>
              <p className="text-slate-500 text-[11px]">
                Drop a timetable, syllabus, or notice in the homepage ingestion zone to populate.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-obsidian-border text-[11px] text-slate-400 uppercase tracking-wider bg-obsidian-950/60">
                    <th className="p-3">Type</th>
                    <th className="p-3">Title / Course</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Timings / Deadline</th>
                    <th className="p-3">Metrics</th>
                    <th className="p-3">Cataloged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-obsidian-border/50">
                  {events.map((ev) => (
                    <tr key={ev._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            ev.type === "exam"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : ev.type === "assignment"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : ev.type === "hackathon"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : ev.type === "attendance_record"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {ev.type}
                        </span>
                      </td>
                      <td className="p-3 text-white font-medium">
                        {ev.title}
                        {ev.location && (
                          <span className="block text-[10px] text-slate-500">
                            Loc: {ev.location}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {ev.subject || "—"}
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">
                        {ev.deadline ? (
                          <span className="text-amber-400">
                            Due: {new Date(ev.deadline).toLocaleDateString()}
                          </span>
                        ) : ev.startTime ? (
                          <span>
                            {new Date(ev.startTime).toLocaleDateString()} {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {ev.metadata?.attendancePercent != null ? (
                          <span className="text-emerald-400 font-bold">
                            {ev.metadata.attendancePercent}% Attn
                          </span>
                        ) : ev.metadata?.estimatedEffortHours != null ? (
                          <span>{ev.metadata.estimatedEffortHours} hrs</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap text-[10px]">
                        {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
