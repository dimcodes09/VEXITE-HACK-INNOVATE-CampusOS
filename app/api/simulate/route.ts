import { NextResponse } from "next/server";
import { SchemaType } from "@google/generative-ai";
import { getServerSessionOrThrow, UnauthorizedError } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getGeminiClient } from "@/lib/gemini";
import { CollegeModel } from "@/models/College";
import { EventModel } from "@/models/Event";
import { SimulationModel } from "@/models/Simulation";

const SIMULATION_SYSTEM_PROMPT = `You are a risk simulator for a student. You will receive a hypothetical decision they are considering (e.g. "what if I skip the hackathon"), their current events, attendance status, and the relevant college policy text.

Project the likely consequence of this decision over the next 5-7 days as a day-by-day risk trajectory. Ground every claim in the actual events and policy clauses provided - cite the specific clause where relevant. Be concrete: name actual dates, actual percentages, actual thresholds. Do not give generic advice.

Return ONLY JSON matching the schema. No prose, no markdown fences.`;

const riskLevels = ["low", "medium", "high", "critical"] as const;
type RiskLevel = (typeof riskLevels)[number];

const simulationResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    projectedRiskScore: { type: SchemaType.NUMBER },
    projectedTrajectory: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          day: { type: SchemaType.STRING },
          riskLevel: { type: SchemaType.STRING, enum: [...riskLevels] },
          note: { type: SchemaType.STRING }
        },
        required: ["day", "riskLevel", "note"]
      }
    },
    reasoning: { type: SchemaType.STRING },
    policyCitations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ["projectedRiskScore", "projectedTrajectory", "reasoning", "policyCitations"]
};

type EventForContext = {
  _id: { toString(): string };
  type: string;
  title: string;
  subject?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  deadline?: Date | null;
  location?: string | null;
  metadata: {
    attendancePercent?: number | null;
    estimatedEffortHours?: number | null;
  };
};

type AttendanceRecord = {
  _id: { toString(): string };
  subject?: string | null;
  metadata: { attendancePercent?: number | null };
  createdAt: Date;
};

type CollegePolicy = {
  policyChunks: Array<{ section: string; text: string }>;
};

type SimulationResult = {
  projectedRiskScore: number;
  projectedTrajectory: Array<{ day: string; riskLevel: RiskLevel; note: string }>;
  reasoning: string;
  policyCitations: string[];
};

function serializeEvent(event: EventForContext) {
  return {
    _id: event._id.toString(),
    type: event.type,
    title: event.title,
    subject: event.subject ?? null,
    startTime: event.startTime?.toISOString() ?? null,
    endTime: event.endTime?.toISOString() ?? null,
    deadline: event.deadline?.toISOString() ?? null,
    location: event.location ?? null,
    attendancePercent: event.metadata.attendancePercent ?? null,
    estimatedEffortHours: event.metadata.estimatedEffortHours ?? null
  };
}

function parseSimulation(value: unknown): SimulationResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.projectedRiskScore !== "number" ||
    !Number.isFinite(candidate.projectedRiskScore) ||
    candidate.projectedRiskScore < 0 ||
    candidate.projectedRiskScore > 100 ||
    typeof candidate.reasoning !== "string" ||
    !candidate.reasoning.trim() ||
    !Array.isArray(candidate.projectedTrajectory) ||
    !Array.isArray(candidate.policyCitations) ||
    !candidate.policyCitations.every((citation) => typeof citation === "string")
  ) {
    return null;
  }

  const projectedTrajectory: SimulationResult["projectedTrajectory"] = [];

  for (const item of candidate.projectedTrajectory) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return null;
    }

    const trajectory = item as Record<string, unknown>;

    if (
      typeof trajectory.day !== "string" ||
      !trajectory.day.trim() ||
      !riskLevels.includes(trajectory.riskLevel as RiskLevel) ||
      typeof trajectory.note !== "string" ||
      !trajectory.note.trim()
    ) {
      return null;
    }

    projectedTrajectory.push({
      day: trajectory.day,
      riskLevel: trajectory.riskLevel as RiskLevel,
      note: trajectory.note
    });
  }

  return {
    projectedRiskScore: candidate.projectedRiskScore,
    projectedTrajectory,
    reasoning: candidate.reasoning,
    policyCitations: candidate.policyCitations as string[]
  };
}

export async function POST(request: Request) {
  let session;

  try {
    session = await getServerSessionOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to verify session" }, { status: 500 });
  }

  let body: { hypothetical?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (typeof body.hypothetical !== "string" || !body.hypothetical.trim()) {
    return NextResponse.json({ error: "hypothetical is required" }, { status: 400 });
  }

  const hypothetical = body.hypothetical.trim();
  const collegeId = session.user.collegeId;

  try {
    await connectToDatabase();

    const [events, attendanceRecords, specificCollege, fallbackCollege] = await Promise.all([
      EventModel.find({ userId: session.user._id, type: { $ne: "attendance_record" } })
        .sort({ startTime: 1, deadline: 1 })
        .lean(),
      EventModel.find({ userId: session.user._id, type: "attendance_record" })
        .sort({ createdAt: -1 })
        .lean(),
      collegeId ? CollegeModel.findById(collegeId).select("policyChunks").lean() : null,
      CollegeModel.findOne().select("policyChunks").lean()
    ]);

    const college = specificCollege || fallbackCollege;

    if (!college) {
      return NextResponse.json({ error: "No college policy found in system" }, { status: 404 });
    }

    const context = {
      hypothetical,
      currentEvents: (events as unknown as EventForContext[]).map(serializeEvent),
      attendanceStatus: (attendanceRecords as unknown as AttendanceRecord[]).map((record) => ({
        _id: record._id.toString(),
        subject: record.subject ?? null,
        attendancePercent: record.metadata.attendancePercent ?? null,
        recordedAt: record.createdAt.toISOString()
      })),
      policyChunks: (college as unknown as CollegePolicy).policyChunks.map((chunk) => ({
        section: chunk.section,
        text: chunk.text
      }))
    };

    let modelText: string;

    try {
      const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
      const model = getGeminiClient().getGenerativeModel({
        model: modelName,
        systemInstruction: SIMULATION_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.25,
          responseMimeType: "application/json",
          responseSchema: simulationResponseSchema
        }
      });
      const result = await model.generateContent(JSON.stringify(context));

      modelText = result.response.text();
    } catch (error) {
      console.error("Gemini simulation failed", error);
      return NextResponse.json(
        { error: "Unable to generate a simulation" },
        { status: 502 }
      );
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(modelText);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned an invalid simulation response" },
        { status: 502 }
      );
    }

    const simulation = parseSimulation(parsedResponse);

    if (!simulation) {
      return NextResponse.json(
        { error: "Gemini returned a simulation response with an invalid shape" },
        { status: 502 }
      );
    }

    await SimulationModel.create({
      userId: session.user._id,
      hypothetical,
      projectedRiskScore: simulation.projectedRiskScore,
      projectedTrajectory: simulation.projectedTrajectory,
      reasoning: simulation.reasoning,
      policyCitations: simulation.policyCitations,
      createdAt: new Date()
    });

    return NextResponse.json(simulation);
  } catch (error) {
    console.error("Failed to run simulation", error);
    return NextResponse.json({ error: "Unable to run simulation" }, { status: 500 });
  }
}
