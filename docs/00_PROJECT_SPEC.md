# Campus OS — Master Project Spec (Final)

## Problem Statement (SIH-2026 aligned, adapted)
**"Every student has a different problem. Why does everyone get the same college?"**
College systems treat thousands of students identically, but each student carries a unique combination of timetable, syllabus, deadlines, attendance percentage, exams, hackathon commitments, and personal goals. This information lives scattered across notices, PDFs, WhatsApp screenshots, and verbal announcements. Students don't miss things out of laziness — they miss them because the information was never in one place, and because nobody connects the dots across academic + administrative rules until it's too late (a missed attendance threshold, a clashing deadline, a debarment nobody saw coming).

Existing tools don't solve this: to-do apps and AI planners (Notion AI, Motion, Reclaim, Todoist) all require the student to already know and manually enter the task. None of them read institutional policy documents, none reason across attendance/eligibility rules, and none warn a student about a risk before the student thought to look for it.

## Solution: Campus OS
Campus OS is a web app that ingests a student's raw academic chaos (a photo of a timetable, a PDF syllabus, a screenshot of a notice) via drag-and-drop, and turns it into a living, policy-grounded risk model. Gemini does not schedule tasks — **Gemini investigates the student's situation like an agent, cites the actual college policy document when it flags a risk, and lets the student simulate the consequences of a decision before making it.**

There is no task list, no checkbox, and nothing to manually "add." The homepage is a single briefing: a risk score, the one highest-leverage action right now, and the reasoning behind it.

## Why this is NOT a to-do app / Notion / planner
| | To-do apps / AI planners (Notion AI, Motion, Reclaim, Todoist) | Campus OS |
|---|---|---|
| Input | User manually types/imports known tasks | User drops in messy real-world documents; Gemini extracts structure itself |
| Core function | Schedule known tasks into time slots | Investigate risk the student doesn't know exists yet |
| Grounding | None — generic scheduling logic | Cites the actual college's policy document (real RAG) |
| Interaction | Check things off | Ask "why" and "what if" — live reasoning, not a static list |
| Predictive? | Reactive (shows overdue tasks) | Predictive — simulates consequences of a choice before it happens |

**One-line pitch for judges:** *"A to-do app tells you what you already know you have to do. Campus OS tells you what's about to go wrong before you knew to ask — grounded in your actual college's rules, and it can simulate what happens if you make a different choice, live, right now."*

## The 4 signature AI features (each requires genuine reasoning, not an if-statement)
1. **Agentic investigation** — Gemini uses function calling to decide itself what to check (`get_events()`, `get_attendance()`, `get_policy_clause()`), rather than receiving pre-packaged JSON.
2. **Policy-grounded citations (real RAG)** — college policy documents are chunked and embedded (Gemini `text-embedding-004`), retrieved via MongoDB Atlas Vector Search per query, and only the top-k relevant chunks are passed to Gemini — genuine retrieval, not the whole document stuffed into context. Every risk flag cites the actual section and clause retrieved.
3. **Consequence Simulator** — student types a hypothetical ("what if I skip the hackathon", "what if I miss Thursday's class") and Gemini projects the downstream risk trajectory using real deadlines and real policy clauses. This is predictive, not reactive — the single most novel feature.
4. **Live "why" chat** — a free-text box where the student (or a judge) asks anything about the current risk state and Gemini re-reasons live using the same grounded context. Proves genuine reasoning, not a canned response.

## Tech Stack (all free tier)
| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Deploy on Vercel free tier |
| Backend | Next.js API routes (Route Handlers) | No separate Express server — fewer moving parts for a 5hr build |
| Auth | NextAuth.js (Auth.js) with Google OAuth provider | Students already have Google accounts; zero signup friction |
| AI | Gemini 2.5 Flash via Google AI Studio free API key | Native multimodal (image + PDF + text) input; native function calling; `responseMimeType: application/json` for structured output |
| Database | MongoDB Atlas (M0 free tier) + Mongoose | Matches team's MERN experience; Gemini's JSON output maps directly to documents |
| Policy grounding (RAG) | Policy documents chunked + embedded via Gemini `text-embedding-004`, stored in MongoDB Atlas Vector Search (free M0 tier) | Real retrieval — top-k relevant chunks fetched per query, not the whole document stuffed into context |
| Hosting | Vercel (frontend + API routes together) | One deploy target, free tier sufficient for demo traffic |

## Environment Variables Needed
```
GEMINI_API_KEY=
MONGODB_URI=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Non-Goals for the 5-Hour Build
- No email-forwarding ingestion
- No multi-college / admin panel — single demo college's policy document is enough
- No mobile app — responsive web only
- No push notifications — in-app briefing only for demo
- No multi-tenant vector search tuning — one seeded college with 4 short policy sections is enough for the demo

## Demo Script (for judges)
1. Sign in with Google (2 seconds).
2. Drag in 2–3 real messy files (timetable photo, syllabus PDF, a notice screenshot) — watch structured events populate live.
3. Homepage shows a computed risk score, the top action, and a conflict citing the real policy clause (e.g., "Per Section 4.2 of the academic circular...").
4. Type a hypothetical into the Consequence Simulator — "what if I skip the hackathon" — watch it project the downstream risk change live.
5. Open the "why" chat and let a judge type their own question — get a live, grounded answer, not a script.
