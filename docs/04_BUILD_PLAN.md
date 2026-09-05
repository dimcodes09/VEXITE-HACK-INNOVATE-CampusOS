# Campus OS — 5-Hour Build Plan, Final

Priority order if time runs short: (1) extraction + basic briefing, (2) policy RAG grounding inside the briefing, (3) why-chat, (4) consequence simulator. Build in that order so a coherent demo exists even if the last piece is cut.

## Hour 1 — Skeleton, Auth, Policy Seed
- `npx create-next-app@latest` (TypeScript, Tailwind, App Router).
- MongoDB Atlas M0 cluster → connection string in `.env.local`.
- Install `mongoose`, `next-auth`, `@google/generative-ai`.
- Configure NextAuth.js with Google provider.
- Seed ONE `colleges` document: extract plain text from a real (or realistic sample) attendance/eligibility circular PDF and paste it into `policyText`. This grounds every later feature — do this early, not as an afterthought.
- **Checkpoint:** can sign in with Google; a seeded college policy document exists in MongoDB.

## Hour 2 — Upload + Extraction Pipeline
- Build drag-and-drop upload component (base64 client-side).
- Build `/api/upload`: Gemini Extraction Prompt → parse JSON → insert `events` + `uploads`.
- Define Mongoose schemas: `users`, `colleges`, `events`, `uploads`.
- **Checkpoint:** drag in a real timetable/notice image; confirm structured events land in MongoDB.

## Hour 3 — Agentic Briefing with Policy Citations
- Implement Gemini function-calling loop for `/api/briefing`: define the 3 tools, handle the `functionCall`/`functionResponse` round-trip, log to `toolCallLog`.
- Build homepage briefing UI: risk score, topAction, expandable conflict cards showing `reasoningChain` AND `policyCitation` explicitly (make the citation visually distinct — this is your credibility feature).
- **Checkpoint:** after 2-3 uploads with real conflicting dates/attendance numbers, the briefing shows a coherent risk score, at least one conflict, and a real policy citation quoting the seeded document.

## Hour 4 — Consequence Simulator + Why-Chat
- Build `/api/simulate`: Simulation Prompt → parse trajectory → save/display as a simple day-by-day strip (color-coded risk level).
- Build `/api/chat` + a simple chat UI below the briefing.
- Add "Draft resolution" button + `/api/draft` for conflicts where `draftableResolution: true`.
- **Checkpoint:** typing a hypothetical produces a grounded, day-by-day projection; typing a free-form question in chat gets a specific, cited answer.

## Hour 5 — Demo Rehearsal + Deploy
- Deploy to Vercel; add production env vars (Gemini key, Mongo URI, NextAuth secret, Google OAuth credentials — add the production redirect URI in Google Cloud Console NOW, not last-minute).
- Prepare 2-3 realistic test files (fake timetable, fake syllabus, fake notice) ahead of time for reliable live demo input.
- Run the full demo script (00_PROJECT_SPEC.md) twice end-to-end on the deployed URL.
- Rehearse the exact "why this isn't a to-do app" line and the toolCallLog transparency moment (show the panel of which tools Gemini decided to call, live).
- Prepare a fallback pre-run example in case a live Gemini call is slow during judging.
- **Checkpoint:** deployed, rehearsed twice, backup path ready if wifi/API is unstable.

## Risk mitigations
- If image OCR/extraction quality is inconsistent, keep a clean high-contrast fallback test image ready — don't debug parsing live on stage.
- Test the Google OAuth production redirect URI during Hour 1, not Hour 5 — this is the most common last-minute deploy snag.
- Keep the 5 Gemini calls (extraction, agentic briefing, draft, simulate, chat) as independently testable functions — if one breaks near the end, the rest still demo coherently.
- If function-calling proves too fiddly under time pressure, a documented fallback is one large single-call prompt that still explicitly requests policy citations — less impressive but still functional; don't let this block the whole demo.
