"use client";

import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Top Hero Skeleton */}
      <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-200 rounded-lg" />
          <div className="h-4 w-28 bg-slate-200 rounded-lg" />
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 py-4">
          <div className="w-44 h-44 rounded-full border-8 border-slate-100 bg-slate-50 flex items-center justify-center">
            <div className="w-20 h-10 bg-slate-200 rounded-lg" />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="h-4 w-32 bg-slate-200 rounded-full" />
            <div className="h-20 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main Content Split Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          {[1, 2].map((i) => (
            <div key={i} className="card-panel rounded-2xl p-6 space-y-3">
              <div className="h-5 w-2/3 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 rounded-lg" />
              <div className="h-12 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="card-panel rounded-2xl p-6 h-48 bg-slate-100" />
          <div className="card-panel rounded-2xl p-6 h-36 bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
