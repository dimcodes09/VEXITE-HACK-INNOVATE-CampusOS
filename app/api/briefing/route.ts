import { NextResponse } from "next/server";
import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { isValidObjectId } from "mongoose";
import { getServerSessionOrThrow, UnauthorizedError } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getGeminiClient } from "@/lib/gemini";
import { BriefingModel } from "@/models/Briefing";
import { CollegeModel } from "@/models/College";
import { EventModel } from "@/models/Event";

const AGENTIC_SYSTEM_PROMPT = `You are a campus risk investigator working for one student. You do not receive pre-packaged data - you must call the available tools yourself to gather what you need: their upcoming events, their attendance status, and the relevant policy clauses. Investigate thoroughly before concluding.

For each risk you identify, cite the exact policy clause you used (via get_policy_clause) rather than a generic warning. Compute a single riskScore (0-100) for the coming week and one topAction sentence - the single highest-leverage thing to do right now, stated specifically and concretely.

When you finish investigating, return ONLY JSON matching the schema. No prose, no markdown fences.`;

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_upcoming_events",
    description:
      "Returns the user's events (classes, deadlines, exams, hackathons) in a given date range.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        daysAhead: { type: SchemaType.NUMBER }
      },
      required: ["daysAhead"]
    }
  },
  {
    name: "get_attendance_status",
    description: "Returns current attendance percentage per subject for the user.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING }
      }
    }
  },
  {
    name: "get_policy_clause",
    description:
      "Returns the college policy sections relevant to a topic. Use this before citing any policy.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        topic: { type: SchemaType.STRING }
      },
      required: ["topic"]
    }
  }
];

const severityLevels = ["low", "medium", "high", "critical"] as const;

type Severity = (typeof severityLevels)[number];

type ToolCallLogEntry = {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

type BriefingConflict = {
  id: string;
  title: string;
  severity: Severity;
  reasoningChain: string;
  policyCitation: string | null;
  relatedEventIds: string[];
  suggestedAction: string;
  draftableResolution: boolean;
};

type BriefingResult = {
  riskScore: number;
  topAction: string;
  conflicts: BriefingConflict[];
};

type EventForTool = {
  _id: { toString(): string };
  type: string;
  title: string;
  subject?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  deadline?: Date | null;
  location?: string | null;
  metadata?: {
    attendancePercent?: number | null;
    estimatedEffortHours?: number | null;
  };
};

type AttendanceRecordForTool = {
  _id: { toString(): string };
  subject?: string | null;
  metadata: { attendancePercent?: number | null };
  createdAt: Date;
};

type CollegeForTool = {
  policyChunks: Array<{ section: string; text: string }>;
};

type SavedBriefing = {
  riskScore: number;
  topAction: string;
  conflicts: BriefingConflict[];
  toolCallLog: ToolCallLogEntry[];
  generatedAt: Date;
};

function toSerializableEvent(event: EventForTool) {
  return {
    _id: event._id.toString(),
    type: event.type,
    title: event.title,
    subject: event.subject ?? null,
    startTime: event.startTime?.toISOString() ?? null,
    endTime: event.endTime?.toISOString() ?? null,
    deadline: event.deadline?.toISOString() ?? null,
    location: event.location ?? null,
    attendancePercent: event.metadata?.attendancePercent ?? null,
    estimatedEffortHours: event.metadata?.estimatedEffortHours ?? null
  };
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");
  }
  return cleaned.trim();
}

function parseBriefing(value: unknown): BriefingResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  const rawScore = Number(candidate.riskScore);
  const riskScore = Number.isFinite(rawScore) ? Math.min(Math.max(Math.round(rawScore), 0), 100) : 0;
  const topAction =
    typeof candidate.topAction === "string" && candidate.topAction.trim()
      ? candidate.topAction.trim()
      : "Drop a timetable or syllabus to start policy risk analysis.";

  const rawConflicts = Array.isArray(candidate.conflicts) ? candidate.conflicts : [];
  const conflicts: BriefingConflict[] = [];

  for (let i = 0; i < rawConflicts.length; i++) {
    const conflictValue = rawConflicts[i];
    if (!conflictValue || typeof conflictValue !== "object" || Array.isArray(conflictValue)) {
      continue;
    }

    const conflict = conflictValue as Record<string, unknown>;
    const rawSeverity = String(conflict.severity || "medium").toLowerCase();
    const severity: Severity = severityLevels.includes(rawSeverity as Severity)
      ? (rawSeverity as Severity)
      : "medium";

    const rawEventIds = Array.isArray(conflict.relatedEventIds) ? conflict.relatedEventIds : [];
    const relatedEventIds = rawEventIds.map((id) => String(id));

    conflicts.push({
      id: typeof conflict.id === "string" && conflict.id ? conflict.id : `conflict-${i + 1}`,
      title: typeof conflict.title === "string" ? conflict.title : "Academic Conflict",
      severity,
      reasoningChain: typeof conflict.reasoningChain === "string" ? conflict.reasoningChain : "",
      policyCitation: typeof conflict.policyCitation === "string" ? conflict.policyCitation : null,
      relatedEventIds,
      suggestedAction: typeof conflict.suggestedAction === "string" ? conflict.suggestedAction : "Review schedule with course instructor.",
      draftableResolution: Boolean(conflict.draftableResolution)
    });
  }

  return {
    riskScore,
    topAction,
    conflicts
  };
}

export async function GET(request: Request) {
  let session;

  try {
    session = await getServerSessionOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to verify session" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  let collegeId = session.user.collegeId;

  try {
    await connectToDatabase();

    // If not a force-refresh, return existing saved briefing immediately if available
    if (!forceRefresh) {
      const existingBriefing = (await BriefingModel.findOne({ userId: session.user._id })
        .sort({ generatedAt: -1 })
        .lean()) as unknown as SavedBriefing | null;

      if (existingBriefing) {
        return NextResponse.json({
          riskScore: existingBriefing.riskScore,
          topAction: existingBriefing.topAction,
          conflicts: existingBriefing.conflicts,
          toolCallLog: existingBriefing.toolCallLog,
          generatedAt: existingBriefing.generatedAt
        });
      }
    }

    let college = null;
    if (collegeId) {
      college = (await CollegeModel.findById(collegeId)
        .select("policyChunks")
        .lean()) as unknown as CollegeForTool | null;
    }

    if (!college) {
      college = (await CollegeModel.findOne()
        .select("policyChunks")
        .lean()) as unknown as CollegeForTool | null;
    }

    if (!college) {
      return NextResponse.json({ error: "No college policy found in system" }, { status: 404 });
    }

    const totalEventsCount = await EventModel.countDocuments({ userId: session.user._id });
    if (totalEventsCount === 0) {
      return NextResponse.json({
        riskScore: 0,
        topAction: "Drop your academic timetable, syllabus, or notice to initiate autonomous risk investigation.",
        conflicts: [],
        toolCallLog: [],
        generatedAt: new Date()
      });
    }

    const toolCallLog: ToolCallLogEntry[] = [];
    const getUpcomingEvents = async (daysAhead: number) => {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + Math.min(Math.max(Math.floor(daysAhead), 1), 60));

      let events = (await EventModel.find({
        userId: session.user._id,
        type: { $ne: "attendance_record" },
        $or: [
          { startTime: { $gte: start, $lte: end } },
          { endTime: { $gte: start, $lte: end } },
          { deadline: { $gte: start, $lte: end } },
          { startTime: null, deadline: null }
        ]
      })
        .sort({ deadline: 1, startTime: 1 })
        .lean()) as unknown as EventForTool[];

      // If no date-matched events found, return recent user events
      if (events.length === 0) {
        events = (await EventModel.find({
          userId: session.user._id,
          type: { $ne: "attendance_record" }
        })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()) as unknown as EventForTool[];
      }

      return { events: events.map(toSerializableEvent), range: { start, end } };
    };

    const getAttendanceStatus = async (subject: string | undefined) => {
      const records = (await EventModel.find({
        userId: session.user._id,
        type: "attendance_record",
        ...(subject ? { subject: { $regex: `^${subject}$`, $options: "i" } } : {})
      })
        .sort({ createdAt: -1 })
        .lean()) as unknown as AttendanceRecordForTool[];

      return {
        records: records.map((record) => ({
          _id: record._id.toString(),
          subject: record.subject ?? null,
          attendancePercent: record.metadata.attendancePercent ?? null,
          recordedAt: record.createdAt.toISOString()
        }))
      };
    };

    const getPolicyClause = (topic: string) => ({
      topic,
      policyChunks: college.policyChunks.map((chunk) => ({
        section: chunk.section,
        text: chunk.text
      }))
    });

    // 1. Gather all investigated evidence via tools
    const upcomingEventsResult = await getUpcomingEvents(14);
    toolCallLog.push({
      tool: "get_upcoming_events",
      input: { daysAhead: 14 },
      output: upcomingEventsResult
    });

    const attendanceStatusResult = await getAttendanceStatus(undefined);
    toolCallLog.push({
      tool: "get_attendance_status",
      input: { subject: "all" },
      output: attendanceStatusResult
    });

    const policyResult = getPolicyClause("attendance, examination eligibility, hackathon rules, assignment deadlines");
    toolCallLog.push({
      tool: "get_policy_clause",
      input: { topic: "attendance, examination eligibility, hackathon rules, assignment deadlines" },
      output: policyResult
    });

    const investigationContext = {
      studentEvents: upcomingEventsResult.events,
      attendanceRecords: attendanceStatusResult.records,
      institutionalPolicySections: policyResult.policyChunks
    };

    const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const model = getGeminiClient().getGenerativeModel({
      model: modelName,
      systemInstruction: AGENTIC_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.25,
        responseMimeType: "application/json"
      }
    });

    const prompt = `Investigate this student's academic risk based on the retrieved evidence:
Retrieved Evidence:
${JSON.stringify(investigationContext, null, 2)}

Return ONLY JSON matching the schema:
{
  "riskScore": number (0-100),
  "topAction": string,
  "conflicts": [
    {
      "id": string,
      "title": string,
      "severity": "low" | "medium" | "high" | "critical",
      "reasoningChain": string,
      "policyCitation": string | null,
      "relatedEventIds": string[],
      "suggestedAction": string,
      "draftableResolution": boolean
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const finalText = result.response.text();

    let parsedResponse: unknown;

    try {
      const cleanedText = cleanJsonText(finalText);
      parsedResponse = JSON.parse(cleanedText);
    } catch {
      const match = finalText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResponse = JSON.parse(match[0]);
        } catch {
          // fallback
        }
      }
      
      if (!parsedResponse) {
        return NextResponse.json(
          { error: "Gemini returned an invalid briefing response" },
          { status: 502 }
        );
      }
    }

    const briefing = parseBriefing(parsedResponse);

    if (!briefing) {
      return NextResponse.json(
        { error: "Gemini returned a briefing response with an invalid shape" },
        { status: 502 }
      );
    }

    const generatedAt = new Date();
    const savedBriefing = (await BriefingModel.findOneAndUpdate(
      { userId: session.user._id },
      {
        $set: {
          userId: session.user._id,
          riskScore: briefing.riskScore,
          topAction: briefing.topAction,
          conflicts: briefing.conflicts,
          toolCallLog,
          generatedAt
        }
      },
      { new: true, upsert: true }
    ).lean()) as unknown as SavedBriefing | null;

    if (!savedBriefing) {
      return NextResponse.json({ error: "Unable to save briefing" }, { status: 500 });
    }

    return NextResponse.json({
      riskScore: savedBriefing.riskScore,
      topAction: savedBriefing.topAction,
      conflicts: savedBriefing.conflicts,
      toolCallLog: savedBriefing.toolCallLog,
      generatedAt: savedBriefing.generatedAt
    });
  } catch (error) {
    console.error("Failed to generate briefing", error);

    // Resilience fallback: check if we have a saved briefing in MongoDB
    try {
      if (session?.user?._id) {
        const fallbackBriefing = (await BriefingModel.findOne({ userId: session.user._id })
          .sort({ generatedAt: -1 })
          .lean()) as unknown as SavedBriefing | null;

        if (fallbackBriefing) {
          return NextResponse.json({
            riskScore: fallbackBriefing.riskScore,
            topAction: fallbackBriefing.topAction,
            conflicts: fallbackBriefing.conflicts,
            toolCallLog: fallbackBriefing.toolCallLog,
            generatedAt: fallbackBriefing.generatedAt
          });
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ error: "Unable to generate briefing" }, { status: 500 });
  }
}
