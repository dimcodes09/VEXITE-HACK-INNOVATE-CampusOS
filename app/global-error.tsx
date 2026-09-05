"use client";

import React from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
          <h2 className="text-xl font-bold text-white">System Level Interruption</h2>
          <p className="text-xs text-rose-400 font-mono">{error.message}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono rounded-lg transition-colors"
          >
            Reload Campus OS
          </button>
        </div>
      </body>
    </html>
  );
}
