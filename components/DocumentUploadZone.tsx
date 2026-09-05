"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  Scan,
  Zap
} from "lucide-react";

interface DocumentUploadZoneProps {
  onUploadSuccess: (newEvents: any[]) => Promise<void> | void;
  fullPageView?: boolean;
}

export default function DocumentUploadZone({
  onUploadSuccess,
  fullPageView = false
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedEvents, setExtractedEvents] = useState<any[] | null>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setExtractedEvents(null);
    setProcessingStage("Encoding academic document...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(",")[1];
          setProcessingStage("Gemini 3.6 Flash multimodal vision extraction...");

          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type || "image/png"
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to process document");
          }

          setProcessingStage("Cataloging events & re-investigating risk...");
          setExtractedEvents(data.events || []);

          await onUploadSuccess(data.events || []);
          setProcessingStage("");
        } catch (err: any) {
          setErrorMessage(err.message || "Failed to extract academic structure.");
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage("Failed to read the local file.");
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || "Error handling file.");
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const handleTextSubmit = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setExtractedEvents(null);
    setProcessingStage("Extracting events from notice text...");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawText.trim(),
          mimeType: "text/plain"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process text");
      }

      setProcessingStage("Cataloging events & re-investigating risk...");
      setExtractedEvents(data.events || []);
      setRawText("");

      await onUploadSuccess(data.events || []);
      setProcessingStage("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse text notice.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickDemoInject = async (
    sampleType: "timetable" | "hackathon" | "attendance"
  ) => {
    let sampleNotice = "";
    if (sampleType === "timetable") {
      sampleNotice = `DEMO INSTITUTE OF TECHNOLOGY - SEMESTER SCHEDULE
Subject: Database Management Systems (DBMS-301)
Timings: Every Tuesday & Thursday 09:00 AM - 11:00 AM in Hall C
Mid-Semester Assessment: October 14, 2026, 10:00 AM
Final Assignment Deadline: October 18, 2026, 11:59 PM (Weightage 25%)`;
    } else if (sampleType === "hackathon") {
      sampleNotice = `OFFICIAL CONFIRMATION: SIH-2026 Grand Finale
Event: National Smart India Hackathon
Departure: October 12, 2026. Return: October 15, 2026.
Note: Coincides with regular teaching days (Tuesday & Wednesday). Requires HOD sanction for attendance credit.`;
    } else {
      sampleNotice = `OFFICIAL ATTENDANCE RECORD (MID-SEM FREEZE)
Student: Current Registered Scholar
DBMS-301 Attendance: 68.5% (Threshold: 75%)
Computer Networks: 82.0%
Operating Systems: 74.0%
Warning: DBMS attendance is below the 75% end-sem examination eligibility cutoff.`;
    }

    setRawText(sampleNotice);
    setMode("text");
  };

  return (
    <div className={`space-y-6 ${fullPageView ? "max-w-5xl mx-auto" : ""}`}>
      {/* Top Banner if Full Page */}
      {fullPageView && (
        <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold">
              <Scan className="w-3.5 h-3.5" />
              MULTIMODAL DOCUMENT VISION INGESTION
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ingest Academic Chaos Directly Into The Radar
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Drop photos of messy paper timetables, syllabus PDFs, or circular notices. Gemini extracts dates, subjects, and attendance percentages into database records.
            </p>
          </div>
          <div className="w-full md:w-64 h-36 rounded-2xl overflow-hidden border border-slate-200 relative flex-shrink-0 shadow-sm">
            <img
              src="/assets/document_vision_scanner.jpg"
              alt="Document Scanner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header with Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                Academic Document Ingestion
              </h2>
              <p className="text-xs font-mono text-slate-500">
                DRAG & DROP // VISION OCR // AUTOMATIC RE-INVESTIGATION
              </p>
            </div>
          </div>

          {/* Mode Switch Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === "file"
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              File Drop (Image/PDF)
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === "text"
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Paste Notice Text
            </button>
          </div>
        </div>

        {/* Dropzone */}
        {mode === "file" ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? "border-indigo-600 bg-indigo-50 scale-[1.01]"
                : "border-indigo-200/90 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />

            {isProcessing ? (
              <div className="space-y-4 py-6 flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <div className="space-y-1 text-center">
                  <p className="text-sm font-semibold text-indigo-700">
                    {processingStage || "Extracting Multimodal Academic Structure..."}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Gemini 3.6 Flash parsing entities & calculating policy grounding
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center text-indigo-600 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    <span className="text-indigo-600 font-bold">Drop timetable, syllabus, or notice</span> or click to browse
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Supports PNG, JPG, PDF, TXT (Multimodal Vision Engine)
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Text Paste Box */
          <div className="space-y-4">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              placeholder="Paste syllabus extract, circular notice text, WhatsApp announcement, or attendance freeze circular here..."
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none leading-relaxed"
            />
            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={isProcessing || !rawText.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{processingStage || "Processing Notice..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Events & Update Risk Radar</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Demo Quick Sample Injections (CampusMart Style) */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-700 font-bold uppercase tracking-wider">
              One-Click Demo Test Circulars:
            </span>
            <span className="text-[11px] text-slate-500">Instant test circulars</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleQuickDemoInject("timetable")}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all cursor-pointer group"
            >
              <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                + DBMS Timetable
              </span>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Tue/Thu 9am classes & Mid-Sem exams</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoInject("hackathon")}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 text-left transition-all cursor-pointer group"
            >
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                + SIH Hackathon Clash
              </span>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Oct 12-15 external national event</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoInject("attendance")}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 text-left transition-all cursor-pointer group"
            >
              <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                + 68% Attendance Notice
              </span>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Triggers policy condonation conflict</p>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Newly Extracted Events Feedback */}
        {extractedEvents && extractedEvents.length > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-800">
              <span className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {extractedEvents.length} Academic Events Extracted Successfully
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Briefing Refreshed Live</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {extractedEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white text-xs text-slate-800 border border-emerald-100 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold border border-indigo-100">
                      {event.type}
                    </span>
                    <span className="truncate font-medium">{event.title}</span>
                  </div>
                  {event.attendancePercent && (
                    <span className="text-emerald-700 font-bold text-[11px] flex-shrink-0">
                      {event.attendancePercent}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
