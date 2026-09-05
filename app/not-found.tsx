"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-obsidian-950 bg-cyber-grid flex items-center justify-center p-4 text-center">
      <div className="glass-panel-elevated max-w-md w-full p-8 rounded-2xl border border-obsidian-border space-y-4">
        <div className="w-12 h-12 rounded-xl bg-obsidian-850 text-rose-400 border border-obsidian-border flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-xl text-white">404 // Route Uncharted</h2>
        <p className="text-xs font-mono text-slate-400">
          The requested telemetry coordinate does not exist in Campus OS.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Briefing HUD</span>
        </Link>
      </div>
    </div>
  );
}
