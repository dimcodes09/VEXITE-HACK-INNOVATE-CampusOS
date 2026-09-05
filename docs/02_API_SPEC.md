# Campus OS — API Spec (Next.js Route Handlers), Final

Base path: `/app/api/*`. All routes except `/api/auth/*` require an authenticated session (NextAuth). All routes assume a single seeded `college` document for the hackathon demo.

## `POST /api/upload`
Accepts a dragged-in file (image, PDF) or pasted text; sends it to Gemini for multimodal extraction; saves resulting events to MongoDB.

**Request body:**
```json
{ "fileBase64": "string (optional)", "mimeType": "image/png | application/pdf | text/plain", "rawText": "string (optional)" }
```
**Response:**
```json
{ "uploadId": "string", "eventsExtracted": 4, "events": [ /* event objects */ ] }
```
**Server logic:** validate session → call Gemini Extraction Prompt (see 03_GEMINI_PROMPTS.md) → parse structured JSON → insert `events` + `uploads` → trigger a briefing recompute internally.

---

## `GET /api/briefing`
Runs the **agentic investigation** and returns the current risk briefing.

**Response:**
```json
{
  "riskScore": 78,
  "topAction": "Email your DBMS professor about the attendance threshold today.",
  "conflicts": [ /* see 01_DATA_MODELS.md */ ],
  "toolCallLog": [ /* which functions Gemini called and why — used for demo transparency */ ],
  "generatedAt": "2026-09-05T10:00:00Z"
}
```
**Server logic:**
1. Load the user's college `policyText`.
2. Call Gemini with function-calling tools enabled: `get_upcoming_events()`, `get_attendance_status()`, `get_policy_clause(topic)` (see 03_GEMINI_PROMPTS.md → Agentic Reasoning Prompt).
3. Gemini decides which tools to call and in what order; log every call into `toolCallLog`.
4. Parse the final structured JSON response into the `briefings` shape (including `policyCitation` per conflict where relevant).
5. Upsert into `briefings`, return it.

---

## `POST /api/draft`
Generates a resolution draft (e.g., extension-request email) for a specific conflict.

**Request:** `{ "conflictId": "string" }`
**Response:** `{ "subject": "string", "body": "string" }`
**Server logic:** look up the conflict in the latest briefing → call Gemini Draft Prompt with the conflict's reasoning chain + policy citation → save to `drafts` → return.

---

## `POST /api/simulate`
Runs the **Consequence Simulator** for a student-typed hypothetical.

**Request:** `{ "hypothetical": "what if I skip the hackathon" }`
**Response:**
```json
{
  "projectedRiskScore": 45,
  "projectedTrajectory": [ { "day": "Tue", "riskLevel": "medium", "note": "..." }, { "day": "Wed", "riskLevel": "high", "note": "..." } ],
  "reasoning": "string",
  "policyCitations": ["Section 4.2: ..."]
}
```
**Server logic:** pass the hypothetical + user's current events + policy text to Gemini Simulation Prompt (see 03_GEMINI_PROMPTS.md) → parse structured trajectory → save to `simulations` → return.

---

## `POST /api/chat`
The live "why" interrogation endpoint.

**Request:** `{ "message": "string" }`
**Response:** `{ "reply": "string" }`
**Server logic:** load recent `chat_messages` for context + current briefing + policy text → call Gemini Chat Prompt → append both messages to `chat_messages` → return the reply.

---

## `GET /api/events`
Returns all events for the logged-in user (debug/list view, optional for demo).

## Auth routes
Handled by NextAuth.js at `/api/auth/[...nextauth]` — Google provider only, no custom code beyond config.
