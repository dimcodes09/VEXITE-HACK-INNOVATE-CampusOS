"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  Search,
  AlertCircle
} from "lucide-react";

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

export default function EventsLedgerView() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load events ledger");
      }
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || "Unable to query MongoDB events collection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const eventTypes = ["all", "class", "assignment", "exam", "hackathon", "attendance_record", "notice"];

  const filteredEvents = events.filter((ev) => {
    const matchesType = selectedType === "all" || ev.type === selectedType;
    const matchesSearch =
      searchQuery === "" ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.subject && ev.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold">
            <Database className="w-3.5 h-3.5" />
            LIVE ACADEMIC EVENTS TELEMETRY LEDGER
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ingested Database Ledger ({events.length} Records)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xl">
            Inspect all structured classes, assignment deadlines, examination circulars, and attendance records extracted by Gemini and stored in MongoDB.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs hover:scale-[1.02]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-panel-elevated rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course, title, or room..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {eventTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer ${
                  selectedType === t
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="card-panel-elevated rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-mono text-xs">Querying MongoDB events collection...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-rose-700 font-mono text-xs">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Database className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-slate-700 font-semibold">No matching records found.</p>
            <p className="text-slate-500 text-xs font-mono">
              Drop a timetable or syllabus in Document Ingestion to populate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-4 font-semibold">Entity Type</th>
                  <th className="p-4 font-semibold">Title / Name</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">Schedule / Due Date</th>
                  <th className="p-4 font-semibold">Metrics</th>
                  <th className="p-4 font-semibold">Ingested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border ${
                          ev.type === "exam"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : ev.type === "assignment"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : ev.type === "hackathon"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : ev.type === "attendance_record"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {ev.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-slate-900 font-medium">
                      <span className="text-slate-900 font-bold block">{ev.title}</span>
                      {ev.location && (
                        <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">
                          Location: {ev.location}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 font-semibold">{ev.subject || "—"}</td>
                    <td className="p-4 text-slate-700 whitespace-nowrap">
                      {ev.deadline ? (
                        <span className="text-amber-800 font-semibold">
                          Due: {new Date(ev.deadline).toLocaleDateString()}
                        </span>
                      ) : ev.startTime ? (
                        <span>
                          {new Date(ev.startTime).toLocaleDateString()}{" "}
                          {new Date(ev.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-700">
                      {ev.metadata?.attendancePercent != null ? (
                        <span className="text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                          {ev.metadata.attendancePercent}% Attn
                        </span>
                      ) : ev.metadata?.estimatedEffortHours != null ? (
                        <span className="text-slate-600">{ev.metadata.estimatedEffortHours} hrs effort</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-[11px] whitespace-nowrap font-mono">
                      {ev.createdAt
                        ? new Date(ev.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
