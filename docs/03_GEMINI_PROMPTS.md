# Campus OS — Gemini Prompt & Tool Specs, Final

Model: `gemini-2.5-flash` (free tier, Google AI Studio API key). Use `responseMimeType: application/json` with a `responseSchema` for every call that isn't using function calling. Use `temperature` 0.2–0.3 for extraction/reasoning/simulation, ~0.5 for the draft email and chat replies.

---

## 1. Extraction Prompt (`/api/upload`)
**Input:** uploaded file (inline base64 image/PDF) or raw text.
```
You are an extraction engine for a student productivity tool. You will receive a messy, real-world academic document: a timetable photo, a syllabus PDF, a screenshot of a notice, or a hackathon registration confirmation.

Extract every distinct academic event you can identify: type, title, subject, relevant dates/times, and any attendance-related numbers if present. Do not invent information not present in the source; use null for undeterminable fields.

Return ONLY a JSON array matching the schema. No prose, no markdown fences.
```
**Schema:** array of `{ type, title, subject, startTime, endTime, deadline, location, attendancePercent, attendanceThreshold, estimatedEffortHours }` (see 01_DATA_MODELS.md `events`).

---

## 2. Agentic Reasoning Prompt (`/api/briefing`) — uses native function calling
This is the core differentiator: Gemini decides what to check, not your code.

**Tools defined for Gemini:**
```json
[
  {
    "name": "get_upcoming_events",
    "description": "Returns the user's events (classes, deadlines, exams, hackathons) in a given date range.",
    "parameters": { "type": "object", "properties": { "daysAhead": { "type": "number" } } }
  },
  {
    "name": "get_attendance_status",
    "description": "Returns current attendance percentage per subject for the user.",
    "parameters": { "type": "object", "properties": { "subject": { "type": "string" } } }
  },
  {
    "name": "get_policy_clause",
    "description": "Retrieves the most relevant college policy chunk(s) for a topic via semantic vector search (e.g. 'attendance', 'exam eligibility', 'hackathon participation', 'late submission'). Returns the top-2 matching sections with their exact text — this is real retrieval, not a keyword lookup or the full document.",
    "parameters": { "type": "object", "properties": { "topic": { "type": "string" } } }
  }
]
```
**How `get_policy_clause` is executed server-side (RAG pipeline):**
1. Embed the `topic` string using `text-embedding-004`.
2. Run a MongoDB Atlas `$vectorSearch` against `colleges.policyChunks.embedding` (index: `policy_vector_index`), `numCandidates: 20`, `limit: 2`.
3. Return the top-2 chunks' `section` + `text` as the tool's `functionResponse` to Gemini.
4. Gemini cites the retrieved `section` name directly in its `policyCitation` output field — never invents a section it wasn't given.
**System instruction:**
```
You are a campus risk investigator working for one student. You do not receive pre-packaged data — you must call the available tools yourself to gather what you need: their upcoming events, their attendance status, and the relevant policy clauses. Investigate thoroughly before concluding.

For each risk you identify, cite the exact policy clause you used (via get_policy_clause) rather than a generic warning. Compute a single riskScore (0-100) for the coming week and one topAction sentence — the single highest-leverage thing to do right now, stated specifically and concretely.

When you finish investigating, return ONLY JSON matching the schema. No prose, no markdown fences.
```
**Final responseSchema:** `{ riskScore, topAction, conflicts: [{ id, title, severity, reasoningChain, policyCitation, relatedEventIds, suggestedAction, draftableResolution }] }`

**Implementation note:** use the Gemini SDK's function-calling loop — send the tools + prompt, receive a `functionCall` response, execute the corresponding MongoDB query server-side, send the result back as a `functionResponse`, repeat until Gemini returns a final text/JSON answer. Log every round-trip into `toolCallLog` for the demo's transparency panel.

---

## 3. Draft Prompt (`/api/draft`)
```
You are drafting a short, polite, professional email from a student to their professor or administration, based on a specific academic conflict. Use the real details and policy citation provided — do not invent facts. Be concise and specific about the request (extension, attendance condonation, rescheduling).

Return ONLY JSON: { "subject": string, "body": string }. No prose, no markdown fences.
```

---

## 4. Consequence Simulator Prompt (`/api/simulate`)
```
You are a risk simulator for a student. You will receive a hypothetical decision they are considering (e.g. "what if I skip the hackathon"), their current events, attendance status, and the relevant college policy text.

Project the likely consequence of this decision over the next 5-7 days as a day-by-day risk trajectory. Ground every claim in the actual events and policy clauses provided — cite the specific clause where relevant. Be concrete: name actual dates, actual percentages, actual thresholds. Do not give generic advice.

Return ONLY JSON matching the schema. No prose, no markdown fences.
```
**Schema:** `{ projectedRiskScore, projectedTrajectory: [{ day, riskLevel, note }], reasoning, policyCitations: [string] }`

---

## 5. Chat Prompt (`/api/chat`) — the "why" interrogation
```
You are answering a follow-up question about a student's current academic risk briefing. You have access to their current briefing, their events, attendance, and the college policy text. Answer specifically and concretely, citing real numbers and policy clauses where relevant. If the question poses a hypothetical, reason through it the same way the Consequence Simulator would, briefly.

Keep the answer conversational but precise — a few sentences, not a report.
```
**Output:** plain text reply (no forced JSON needed here — this is a conversational endpoint).

---

## Implementation notes
- Use `@google/generative-ai` (free-tier compatible) for both generation calls and the `text-embedding-004` embedding model — same package, separate free-tier quota.
- For image/PDF input, pass as `inlineData: { mimeType, data: base64String }`.
- Policy chunks are embedded once at seed time, not per-request — only the query `topic` gets embedded live inside `get_policy_clause`.
- Debounce/cache repeated calls during testing to conserve free-tier quota; don't loop-test against the live API.
