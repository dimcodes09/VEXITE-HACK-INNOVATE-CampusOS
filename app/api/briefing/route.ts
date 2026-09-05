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

function parseBriefing(value: unknown): BriefingResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.riskScore !== "number" ||
    !Number.isFinite(candidate.riskScore) ||
    candidate.riskScore < 0 ||
    candidate.riskScore > 100 ||
    typeof candidate.topAction !== "string" ||
    !candidate.topAction.trim() ||
    !Array.isArray(candidate.conflicts)
  ) {
    return null;
  }

  const conflicts: BriefingConflict[] = [];

  for (const conflictValue of candidate.conflicts) {
    if (!conflictValue || typeof conflictValue !== "object" || Array.isArray(conflictValue)) {
      return null;
    }

    const conflict = conflictValue as Record<string, unknown>;
    const relatedEventIds = conflict.relatedEventIds;

    if (
      typeof conflict.id !== "string" ||
      typeof conflict.title !== "string" ||
      !severityLevels.includes(conflict.severity as Severity) ||
      typeof conflict.reasoningChain !== "string" ||
      (conflict.policyCitation !== null && typeof conflict.policyCitation !== "string") ||
      !Array.isArray(relatedEventIds) ||
      !relatedEventIds.every(
        (eventId) => typeof eventId === "string" && isValidObjectId(eventId)
      ) ||
      typeof conflict.suggestedAction !== "string" ||
      typeof conflict.draftableResolution !== "boolean"
    ) {
      return null;
    }

    conflicts.push({
      id: conflict.id,
      title: conflict.title,
      severity: conflict.severity as Severity,
      reasoningChain: conflict.reasoningChain,
      policyCitation: conflict.policyCitation as string | null,
      relatedEventIds,
      suggestedAction: conflict.suggestedAction,
      draftableResolution: conflict.draftableResolution
    });
  }

  return {
    riskScore: candidate.riskScore,
    topAction: candidate.topAction,
    conflicts
  };
}

export async function GET() {
  let session;

  try {
    session = await getServerSessionOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to verify session" }, { status: 500 });
  }

  if (!session.user.collegeId) {
    return NextResponse.json(
      { error: "No college policy has been assigned to this user" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const college = (await CollegeModel.findById(session.user.collegeId)
      .select("policyChunks")
      .lean()) as unknown as CollegeForTool | null;

    if (!college) {
      return NextResponse.json({ error: "Assigned college was not found" }, { status: 404 });
    }

    const toolCallLog: ToolCallLogEntry[] = [];
    const getUpcomingEvents = async (daysAhead: number) => {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + Math.min(Math.max(Math.floor(daysAhead), 1), 30));

      const events = (await EventModel.find({
        userId: session.user._id,
        $or: [
          { startTime: { $gte: start, $lte: end } },
          { endTime: { $gte: start, $lte: end } },
          { deadline: { $gte: start, $lte: end } }
        ]
      })
        .sort({ startTime: 1, deadline: 1 })
        .lean()) as unknown as EventForTool[];

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

    const model = getGeminiClient().getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: AGENTIC_SYSTEM_PROMPT,
      tools: [{ functionDeclarations }],
      generationConfig: { temperature: 0.25 }
    });
    const chat = model.startChat();
    let result = await chat.sendMessage(
      "Investigate the student's academic risk for the coming week. Use the available tools before reaching a conclusion."
    );
    let finalText: string | null = null;

    for (let round = 0; round < 8; round += 1) {
      const functionCalls = result.response.functionCalls();

      if (!functionCalls?.length) {
        finalText = result.response.text();
        break;
      }

      const functionResponses = [];

      for (const functionCall of functionCalls) {
        const input = asObject(functionCall.args);
        let output: Record<string, unknown>;

        switch (functionCall.name) {
          case "get_upcoming_events": {
            const requestedDays = input.daysAhead;
            const daysAhead =
              typeof requestedDays === "number" && Number.isFinite(requestedDays)
                ? requestedDays
                : 7;
            output = await getUpcomingEvents(daysAhead);
            break;
          }
          case "get_attendance_status": {
            output = await getAttendanceStatus(
              typeof input.subject === "string" && input.subject.trim()
                ? input.subject.trim()
                : undefined
            );
            break;
          }
          case "get_policy_clause": {
            output = getPolicyClause(
              typeof input.topic === "string" && input.topic.trim()
                ? input.topic.trim()
                : "general academic policy"
            );
            break;
          }
          default:
            output = { error: `Unknown tool: ${functionCall.name}` };
        }

        toolCallLog.push({ tool: functionCall.name, input, output });
        console.info("[briefing] tool call", functionCall.name, input);
        console.info("[briefing] tool response", functionCall.name, output);
        functionResponses.push({
          functionResponse: {
            name: functionCall.name,
            response: output
          }
        });
      }

      result = await chat.sendMessage(functionResponses);
    }

    if (!finalText) {
      return NextResponse.json(
        { error: "Gemini did not complete its investigation within the tool-call limit" },
        { status: 502 }
      );
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(finalText);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned an invalid briefing response" },
        { status: 502 }
      );
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
      { new: true, upsert: true, runValidators: true }
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
    return NextResponse.json({ error: "Unable to generate briefing" }, { status: 500 });
  }
}
