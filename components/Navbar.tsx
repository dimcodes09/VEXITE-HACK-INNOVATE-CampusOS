"use client";

import React from "react";
import { signOut } from "next-auth/react";
import {
  ShieldAlert,
  Database,
  LogOut,
  Radio,
  UploadCloud,
  MessageSquare,
  LayoutDashboard,
  Cpu,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export type NavTab = "briefing" | "ingestion" | "simulator" | "chat" | "ledger";

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  eventCount?: number;
  conflictCount?: number;
  onRefreshBriefing?: () => void;
  isRefreshing?: boolean;
}

export default function Navbar({
  user,
  activeTab,
  onSelectTab,
  eventCount = 0,
  conflictCount = 0,
  onRefreshBriefing,
  isRefreshing = false
}: NavbarProps) {
  const tabs = [
    {
      id: "briefing" as NavTab,
      label: "Risk Briefing",
      icon: LayoutDashboard,
      badge: conflictCount > 0 ? `${conflictCount}` : undefined,
      badgeColor: "bg-rose-100 text-rose-700 border-rose-200"
    },
    {
      id: "ingestion" as NavTab,
      label: "Document Ingestion",
      icon: UploadCloud,
      badge: eventCount > 0 ? `${eventCount}` : undefined,
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200"
    },
    {
      id: "simulator" as NavTab,
      label: "Consequence Simulator",
      icon: Cpu,
      badge: "What-If",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "chat" as NavTab,
      label: "Why-Chat AI",
      icon: MessageSquare
    },
    {
      id: "ledger" as NavTab,
      label: "Events Ledger",
      icon: Database,
      badge: `${eventCount}`,
      badgeColor: "bg-slate-150 bg-slate-100 text-slate-700 border-slate-200"
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSelectTab("briefing")}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold tracking-tight text-lg text-slate-900">
                  Campus<span className="text-indigo-600">OS</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 hidden sm:block">
                ACADEMIC RISK INTELLIGENCE RADAR
              </p>
            </div>
          </div>

          {/* Center Tab Navigation (CampusMart Pill Style) */}
          <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-semibold scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : `${tab.badgeColor}`
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status & Profile Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-slate-600">
                Policy: <strong className="text-slate-900 font-semibold">DIT 2026</strong>
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    className="w-8 h-8 rounded-full ring-2 ring-indigo-600/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                    {user.name?.[0]?.toUpperCase() ?? "S"}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                    {user.name ?? "Student"}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px] mt-0.5">
                    {user.email ?? ""}
                  </p>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-200 gap-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? "bg-white/20 text-white" : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
