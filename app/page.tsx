"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Navbar, { type NavTab } from "@/components/Navbar";
import SignInView from "@/components/SignInView";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import RiskScoreHero from "@/components/RiskScoreHero";
import ConflictCardList, { type ConflictItem } from "@/components/ConflictCardList";
import ToolCallLog, { type ToolCallEntry } from "@/components/ToolCallLog";
import DocumentUploadZone from "@/components/DocumentUploadZone";
import ConsequenceSimulator from "@/components/ConsequenceSimulator";
import WhyChatPanel from "@/components/WhyChatPanel";
import EventsLedgerView from "@/components/EventsLedgerView";
import { AlertCircle, ShieldCheck } from "lucide-react";

interface BriefingData {
  riskScore: number;
  topAction: string;
  conflicts: ConflictItem[];
  toolCallLog: ToolCallEntry[];
  generatedAt: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<NavTab>("briefing");
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(true);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [eventCount, setEventCount] = useState<number>(0);

  // Fetch count of cataloged events
  const fetchEventCount = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEventCount(data.total || data.events?.length || 0);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Fetch the core agentic briefing
  const fetchBriefing = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoadingBriefing(true);
      }
      setBriefingError(null);

      try {
        const url = isManualRefresh ? "/api/briefing?refresh=true" : "/api/briefing";
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to run risk briefing investigation.");
        }

        setBriefing(data);
        await fetchEventCount();
      } catch (err: any) {
        setBriefingError(err.message || "Failed to load risk briefing.");
      } finally {
        setLoadingBriefing(false);
        setIsRefreshing(false);
      }
    },
    [fetchEventCount]
  );

  // Trigger briefing load on authentication
  useEffect(() => {
    if (status === "authenticated") {
      fetchBriefing();
    }
  }, [status, fetchBriefing]);

  // Callback when a new document is dropped and parsed
  const handleUploadSuccess = async (_newEvents: any[]) => {
    await fetchEventCount();
    await fetchBriefing(true);
  };

  // Auth Loading State
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 bg-campus-grid flex flex-col">
        <DashboardSkeleton />
      </div>
    );
  }

  // Unauthenticated -> Custom Branded Sign-in View
  if (status === "unauthenticated" || !session) {
    return <SignInView />;
  }

  const activeBriefing = briefing || {
    riskScore: 0,
    topAction:
      "Drop your timetable, syllabus, or notice in the ingestion zone to start autonomous risk investigation.",
    conflicts: [],
    toolCallLog: [],
    generatedAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-campus-grid text-slate-900 flex flex-col selection:bg-indigo-600/20 selection:text-indigo-900">
      {/* Top Navbar with Page Navigation Pills */}
      <Navbar
        user={session.user}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        eventCount={eventCount}
        conflictCount={activeBriefing.conflicts?.length || 0}
        onRefreshBriefing={() => fetchBriefing(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content View Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingBriefing ? (
          <DashboardSkeleton />
        ) : (
          <div className="animate-fade-in">
            {briefingError && (
              <div className="p-4 mb-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>
                    {briefingError} — Switch to Document Ingestion to upload your timetable or notice.
                  </span>
                </div>
                <button
                  onClick={() => fetchBriefing(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Retry Investigation
                </button>
              </div>
            )}

            {/* TAB 1: RISK BRIEFING (HUD) */}
            {activeTab === "briefing" && (
              <div className="space-y-8">
                {/* Hero Risk Gauge & Top Directive */}
                <RiskScoreHero
                  riskScore={activeBriefing.riskScore}
                  topAction={activeBriefing.topAction}
                  generatedAt={activeBriefing.generatedAt}
                  onRefresh={() => fetchBriefing(true)}
                  isRefreshing={isRefreshing}
                  conflictCount={activeBriefing.conflicts?.length || 0}
                  eventCount={eventCount}
                />

                {/* Identified Policy Conflicts (Expandable Cards with Quoted Citations) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-8 space-y-6">
                    <ConflictCardList conflicts={activeBriefing.conflicts || []} />
                  </div>

                  {/* Right Side Quick Ingestion Card & Investigation Trace */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Compact Ingestion Dropzone on Briefing page */}
                    <DocumentUploadZone onUploadSuccess={handleUploadSuccess} fullPageView={false} />

                    {/* Agentic Tool Call Trace */}
                    <ToolCallLog toolCallLog={activeBriefing.toolCallLog || []} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENT INGESTION & VISION SCANNER */}
            {activeTab === "ingestion" && (
              <div className="space-y-6">
                <DocumentUploadZone onUploadSuccess={handleUploadSuccess} fullPageView={true} />
              </div>
            )}

            {/* TAB 3: CONSEQUENCE SIMULATOR */}
            {activeTab === "simulator" && (
              <div className="space-y-6">
                <ConsequenceSimulator currentRiskScore={activeBriefing.riskScore} fullPageView={true} />
              </div>
            )}

            {/* TAB 4: WHY-CHAT AI CONSOLE */}
            {activeTab === "chat" && (
              <div className="space-y-6">
                <WhyChatPanel fullPageView={true} />
              </div>
            )}

            {/* TAB 5: ACADEMIC EVENTS LEDGER */}
            {activeTab === "ledger" && (
              <div className="space-y-6">
                <EventsLedgerView />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-200 py-6 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-bold text-slate-800">CAMPUS OS</span>
            <span>// Institutional Policy Intelligence Radar</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span>DIT CIRCULAR 2026</span>
            <span>•</span>
            <span>GEMINI 3.6 FLASH RAG</span>
            <span>•</span>
            <span>PREDICTIVE CONSEQUENCE ENGINE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
