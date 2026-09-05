"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-obsidian-950 bg-cyber-grid flex items-center justify-center p-4 text-center">
      <div className="glass-panel-elevated max-w-md w-full p-8 rounded-2xl border border-rose-500/30 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-xl text-white">Application Exception</h2>
        <p className="text-xs font-mono text-rose-300">
          {error.message || "An unexpected error interrupted the telemetry stream."}
        </p>
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Telemetry Stream</span>
        </button>
      </div>
    </div>
  );
}
