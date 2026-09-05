# Campus OS — Data Models (MongoDB / Mongoose), Final

## Collection: users
```ts
{
  _id: ObjectId,
  googleId: string,
  email: string,
  name: string,
  image: string,
  collegeId: ObjectId,       // ref: colleges — which policy document applies to them
  createdAt: Date
}
```

## Collection: colleges
Holds policy documents for real RAG grounding — chunked and embedded, not stored as one flat text blob. For the hackathon, seed one college with 3-4 short policy sections (attendance, hackathon/event participation, assignment submission, internal exam rules).
```ts
{
  _id: ObjectId,
  name: string,                    // e.g. "Demo Institute of Technology"
  policyChunks: [
    {
      section: string,             // e.g. "Attendance & Exam Eligibility"
      text: string,                // the chunk's plain text
      embedding: number[]          // vector from Gemini text-embedding-004 (768 dims)
    }
  ],
  createdAt: Date
}
```
Requires a MongoDB Atlas Vector Search index named `policy_vector_index` on `policyChunks.embedding` (768 dimensions, cosine similarity) — created once via the Atlas UI, not in application code.

## Collection: events
One document per extracted academic item.
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  type: "class" | "assignment" | "exam" | "hackathon" | "notice" | "attendance_record",
  title: string,
  subject: string | null,
  startTime: Date | null,
  endTime: Date | null,
  deadline: Date | null,
  location: string | null,
  metadata: {
    attendancePercent: number | null,
    estimatedEffortHours: number | null,
    sourceFileType: "image" | "pdf" | "text",
    rawExtractionNotes: string | null
  },
  sourceUploadId: ObjectId,
  createdAt: Date
}
```

## Collection: uploads
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  originalFilename: string | null,
  mimeType: string,
  geminiRawResponse: object,
  eventsExtractedCount: number,
  createdAt: Date
}
```

## Collection: briefings
Output of the agentic investigation call.
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  riskScore: number,          // 0-100
  topAction: string,
  conflicts: [
    {
      id: string,
      title: string,
      severity: "low" | "medium" | "high" | "critical",
      reasoningChain: string,
      policyCitation: string | null,   // e.g. "Section 4.2: minimum 75% attendance required for exam eligibility"
      relatedEventIds: [ObjectId],
      suggestedAction: string,
      draftableResolution: boolean
    }
  ],
  toolCallLog: [               // record of which functions Gemini decided to call, for transparency/demo
    { tool: string, input: object, output: object }
  ],
  generatedAt: Date
}
```

## Collection: drafts
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  conflictId: string,
  channel: "email",
  subject: string,
  body: string,
  createdAt: Date
}
```

## Collection: simulations
Stores each Consequence Simulator run.
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  hypothetical: string,          // e.g. "what if I skip the hackathon"
  projectedRiskScore: number,
  projectedTrajectory: [
    { day: string, riskLevel: "low" | "medium" | "high" | "critical", note: string }
  ],
  reasoning: string,
  policyCitations: [string],
  createdAt: Date
}
```

## Collection: chat_messages
Stores the "why" chat history per user/session, for context continuity within a session.
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  role: "user" | "assistant",
  content: string,
  createdAt: Date
}
```

## Indexes
- `events`: `{ userId: 1, startTime: 1 }`, `{ userId: 1, deadline: 1 }`
- `briefings`: `{ userId: 1, generatedAt: -1 }`
- `simulations`: `{ userId: 1, createdAt: -1 }`
- `chat_messages`: `{ userId: 1, createdAt: 1 }`
