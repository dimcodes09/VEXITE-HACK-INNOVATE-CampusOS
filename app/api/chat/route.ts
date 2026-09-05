import { NextResponse } from "next/server";
import { getServerSessionOrThrow, UnauthorizedError } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getGeminiClient } from "@/lib/gemini";
import { BriefingModel } from "@/models/Briefing";
import { ChatMessageModel } from "@/models/ChatMessage";
import { CollegeModel } from "@/models/College";
import { EventModel } from "@/models/Event";

const CHAT_SYSTEM_PROMPT = `You are answering a follow-up question about a student's current academic risk briefing. You have access to their current briefing, their events, attendance, and the college policy text. Answer specifically and concretely, citing real numbers and policy clauses where relevant. If the question poses a hypothetical, reason through it the same way the Consequence Simulator would, briefly.

Keep the answer conversational but precise - a few sentences, not a report.`;

type StoredMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

type LatestBriefing = {
  riskScore: number;
  topAction: string;
  conflicts: unknown[];
  generatedAt: Date;
};

type CollegePolicy = {
  policyChunks: Array<{ section: string; text: string }>;
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
};

type AttendanceRecord = {
  _id: { toString(): string };
  subject?: string | null;
  metadata?: { attendancePercent?: number | null };
  createdAt: Date;
};

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

  let body: { message?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const message = body.message.trim();
  const collegeId = session.user.collegeId;

  try {
    await connectToDatabase();

    const [recentMessages, latestBriefing, specificCollege, fallbackCollege, events, attendanceRecords] =
      await Promise.all([
        ChatMessageModel.find({ userId: session.user._id })
          .sort({ createdAt: -1 })
          .limit(12)
          .lean(),
        BriefingModel.findOne({ userId: session.user._id })
          .sort({ generatedAt: -1 })
          .select("riskScore topAction conflicts generatedAt")
          .lean(),
        collegeId ? CollegeModel.findById(collegeId).select("policyChunks").lean() : null,
        CollegeModel.findOne().select("policyChunks").lean(),
        EventModel.find({ userId: session.user._id, type: { $ne: "attendance_record" } })
          .sort({ startTime: 1, deadline: 1 })
          .lean(),
        EventModel.find({ userId: session.user._id, type: "attendance_record" })
          .sort({ createdAt: -1 })
          .lean()
      ]);

    const college = specificCollege || fallbackCollege;

    if (!college) {
      return NextResponse.json({ error: "No college policy found in system" }, { status: 404 });
    }

    const history = (recentMessages as unknown as StoredMessage[])
      .reverse()
      .map((chatMessage) => ({
        role: chatMessage.role,
        content: chatMessage.content,
        createdAt: chatMessage.createdAt.toISOString()
      }));
    const briefing = latestBriefing as unknown as LatestBriefing | null;
    const policy = college as unknown as CollegePolicy;
    const context = {
      conversationHistory: history,
      latestBriefing: briefing
        ? {
            riskScore: briefing.riskScore,
            topAction: briefing.topAction,
            conflicts: briefing.conflicts,
            generatedAt: briefing.generatedAt.toISOString()
          }
        : null,
      currentEvents: (events as unknown as EventForContext[]).map((event) => ({
        _id: event._id.toString(),
        type: event.type,
        title: event.title,
        subject: event.subject ?? null,
        startTime: event.startTime?.toISOString() ?? null,
        endTime: event.endTime?.toISOString() ?? null,
        deadline: event.deadline?.toISOString() ?? null,
        location: event.location ?? null
      })),
      attendanceStatus: (attendanceRecords as unknown as AttendanceRecord[]).map(
        (record) => ({
          _id: record._id.toString(),
          subject: record.subject ?? null,
          attendancePercent: record.metadata?.attendancePercent ?? null,
          recordedAt: record.createdAt.toISOString()
        })
      ),
      policyChunks: policy.policyChunks.map((chunk) => ({
        section: chunk.section,
        text: chunk.text
      }))
    };

    let reply: string;

    try {
      const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
      const model = getGeminiClient().getGenerativeModel({
        model: modelName,
        systemInstruction: CHAT_SYSTEM_PROMPT,
        generationConfig: { temperature: 0.5 }
      });
      const result = await model.generateContent(
        `Context:\n${JSON.stringify(context)}\n\nStudent message:\n${message}`
      );

      reply = result.response.text().trim();
    } catch (error) {
      console.error("Gemini chat failed", error);
      return NextResponse.json({ error: "Unable to generate a reply" }, { status: 502 });
    }

    if (!reply) {
      return NextResponse.json({ error: "Gemini returned an empty reply" }, { status: 502 });
    }

    await ChatMessageModel.insertMany([
      {
        userId: session.user._id,
        role: "user",
        content: message,
        createdAt: new Date()
      },
      {
        userId: session.user._id,
        role: "assistant",
        content: reply,
        createdAt: new Date()
      }
    ]);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Failed to process chat message", error);
    return NextResponse.json({ error: "Unable to process chat message" }, { status: 500 });
  }
}
