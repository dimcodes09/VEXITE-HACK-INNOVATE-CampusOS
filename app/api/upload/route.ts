import { NextResponse } from "next/server";
import { SchemaType } from "@google/generative-ai";
import { getServerSessionOrThrow, UnauthorizedError } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getGeminiClient } from "@/lib/gemini";
import { EventModel } from "@/models/Event";
import { UploadModel } from "@/models/Upload";

const EXTRACTION_SYSTEM_PROMPT = `You are an extraction engine for a student productivity tool. You will receive a messy, real-world academic document: a timetable photo, a syllabus PDF, a screenshot of a notice, or a hackathon registration confirmation.

Extract every distinct academic event you can identify: type, title, subject, relevant dates/times, and any attendance-related numbers if present. Do not invent information not present in the source; use null for undeterminable fields.

Return ONLY a JSON array matching the schema. No prose, no markdown fences.`;

const eventTypes = [
  "class",
  "assignment",
  "exam",
  "hackathon",
  "notice",
  "attendance_record"
] as const;

type EventType = (typeof eventTypes)[number];

type ExtractedEvent = {
  type: EventType;
  title: string;
  subject: string | null;
  startTime: string | null;
  endTime: string | null;
  deadline: string | null;
  location: string | null;
  attendancePercent: number | null;
  estimatedEffortHours: number | null;
};

const extractionResponseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      type: { type: SchemaType.STRING, enum: [...eventTypes] },
      title: { type: SchemaType.STRING },
      subject: { type: SchemaType.STRING, nullable: true },
      startTime: { type: SchemaType.STRING, nullable: true },
      endTime: { type: SchemaType.STRING, nullable: true },
      deadline: { type: SchemaType.STRING, nullable: true },
      location: { type: SchemaType.STRING, nullable: true },
      attendancePercent: { type: SchemaType.NUMBER, nullable: true },
      estimatedEffortHours: { type: SchemaType.NUMBER, nullable: true }
    },
    required: [
      "type",
      "title",
      "subject",
      "startTime",
      "endTime",
      "deadline",
      "location",
      "attendancePercent",
      "estimatedEffortHours"
    ]
  }
};

function sourceFileTypeFor(mimeType: string): "image" | "pdf" | "text" | null {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType === "text/plain") {
    return "text";
  }

  return null;
}

function nullableString(value: unknown): string | null | undefined {
  return value === null || typeof value === "string" ? value : undefined;
}

function nullableNumber(value: unknown): number | null | undefined {
  return value === null || (typeof value === "number" && Number.isFinite(value))
    ? value
    : undefined;
}

function parseExtractedEvents(value: unknown): ExtractedEvent[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedEvents: ExtractedEvent[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const event = item as Record<string, unknown>;
    const subject = nullableString(event.subject);
    const startTime = nullableString(event.startTime);
    const endTime = nullableString(event.endTime);
    const deadline = nullableString(event.deadline);
    const location = nullableString(event.location);
    const attendancePercent = nullableNumber(event.attendancePercent);
    const estimatedEffortHours = nullableNumber(event.estimatedEffortHours);

    if (
      !eventTypes.includes(event.type as EventType) ||
      typeof event.title !== "string" ||
      !event.title.trim() ||
      subject === undefined ||
      startTime === undefined ||
      endTime === undefined ||
      deadline === undefined ||
      location === undefined ||
      attendancePercent === undefined ||
      estimatedEffortHours === undefined
    ) {
      return null;
    }

    parsedEvents.push({
      type: event.type as EventType,
      title: event.title.trim(),
      subject,
      startTime,
      endTime,
      deadline,
      location,
      attendancePercent,
      estimatedEffortHours
    });
  }

  return parsedEvents;
}

function dateOrNull(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

  let body: { fileBase64?: unknown; mimeType?: unknown; rawText?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const { fileBase64, mimeType, rawText } = body;

  if (typeof mimeType !== "string") {
    return NextResponse.json({ error: "mimeType is required" }, { status: 400 });
  }

  const sourceFileType = sourceFileTypeFor(mimeType);

  if (!sourceFileType) {
    return NextResponse.json({ error: "Unsupported mimeType" }, { status: 415 });
  }

  if (sourceFileType === "text" && (typeof rawText !== "string" || !rawText.trim())) {
    return NextResponse.json({ error: "rawText is required for text/plain uploads" }, { status: 400 });
  }

  if (sourceFileType !== "text" && (typeof fileBase64 !== "string" || !fileBase64.trim())) {
    return NextResponse.json({ error: "fileBase64 is required for image and PDF uploads" }, { status: 400 });
  }

  const textInput = typeof rawText === "string" ? rawText : null;
  const base64Input = typeof fileBase64 === "string" ? fileBase64 : null;
  let geminiText: string;

  try {
    const model = getGeminiClient().getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: extractionResponseSchema
      }
    });
    const content =
      sourceFileType === "text"
        ? textInput!
        : [
            {
              inlineData: {
                mimeType,
                data: base64Input!.replace(/^data:[^;]+;base64,/, "")
              }
            }
          ];
    const result = await model.generateContent(content);

    geminiText = result.response.text();
  } catch (error) {
    console.error("Gemini extraction failed", error);
    return NextResponse.json(
      { error: "Unable to extract events from this upload" },
      { status: 502 }
    );
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = JSON.parse(geminiText);
  } catch {
    return NextResponse.json(
      { error: "Gemini returned an invalid extraction response" },
      { status: 502 }
    );
  }

  const extractedEvents = parseExtractedEvents(parsedResponse);

  if (!extractedEvents) {
    return NextResponse.json(
      { error: "Gemini returned an extraction response with an invalid event shape" },
      { status: 502 }
    );
  }

  try {
    await connectToDatabase();

    const upload = await UploadModel.create({
      userId: session.user._id,
      originalFilename: null,
      mimeType,
      geminiRawResponse: { text: geminiText },
      eventsExtractedCount: extractedEvents.length,
      createdAt: new Date()
    });
    const events = await EventModel.insertMany(
      extractedEvents.map((event) => ({
        userId: session.user._id,
        type: event.type,
        title: event.title,
        subject: event.subject,
        startTime: dateOrNull(event.startTime),
        endTime: dateOrNull(event.endTime),
        deadline: dateOrNull(event.deadline),
        location: event.location,
        metadata: {
          attendancePercent: event.attendancePercent,
          estimatedEffortHours: event.estimatedEffortHours,
          sourceFileType,
          rawExtractionNotes: null
        },
        sourceUploadId: upload._id,
        createdAt: new Date()
      }))
    );

    // TODO: Trigger briefing recomputation after uploads are processed.
    return NextResponse.json({
      uploadId: upload._id.toString(),
      eventsExtracted: events.length,
      events
    });
  } catch (error) {
    console.error("Failed to save upload extraction", error);
    return NextResponse.json({ error: "Unable to save extracted events" }, { status: 500 });
  }
}
