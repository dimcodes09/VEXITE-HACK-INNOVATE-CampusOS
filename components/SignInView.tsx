"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { ShieldCheck, Zap, Cpu, ArrowRight, BookOpen } from "lucide-react";

export default function SignInView() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 bg-campus-grid p-4 sm:p-6 overflow-hidden">
      {/* Soft ambient background blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Value Proposition & Persona */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            INSTITUTIONAL RISK INVESTIGATION RADAR
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
            An intelligent sentinel watching over your{" "}
            <span className="text-indigo-600">academic risk</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Every student has a different problem. Campus OS ingests raw timetables, syllabi, and notices, investigates conflicts agentically, and cites real college policy clauses before debarment happens.
          </p>

          {/* Differentiator Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="card-panel rounded-2xl p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase">Multimodal</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag & drop photos, PDFs, or circulars — zero tedious manual entry.
              </p>
            </div>

            <div className="card-panel rounded-2xl p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-600">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase">Policy RAG</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cites real circular clauses (75% cutoff, condonation, late penalties).
              </p>
            </div>

            <div className="card-panel rounded-2xl p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-blue-600">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase">Simulator</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Replays future downstream consequences before you skip or miss.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Action Card */}
        <div className="lg:col-span-5 w-full">
          <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Top Indigo Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600" />

            <div className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-display font-extrabold text-slate-900 tracking-tight">
                Enter Command Briefing
              </h2>
              <p className="text-xs text-slate-500">
                Sign in with your student Google account to load your policy-grounded risk radar.
              </p>
            </div>

            {/* Google Sign In Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-xs">Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-indigo-200" />
                  </>
                )}
              </button>
            </div>

            {/* Institutional Seed Note */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Pre-linked: <span className="text-slate-800 font-semibold">Demo Institute of Technology</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Policy vector memory preloaded (Attendance, Assessments, Hackathons, Submissions).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
