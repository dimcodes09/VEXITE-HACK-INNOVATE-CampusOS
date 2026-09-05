import { NextResponse } from "next/server";
import { getServerSessionOrThrow, UnauthorizedError } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { EventModel } from "@/models/Event";

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

  try {
    await connectToDatabase();

    type EventLeanDoc = {
      _id: { toString(): string };
      type: string;
      title: string;
      subject?: string | null;
      startTime?: Date | null;
      endTime?: Date | null;
      deadline?: Date | null;
      location?: string | null;
      metadata?: Record<string, unknown>;
      sourceUploadId?: { toString(): string } | null;
      createdAt?: Date | null;
    };

    const events = (await EventModel.find({ userId: session.user._id })
      .sort({ deadline: 1, startTime: 1, createdAt: -1 })
      .lean()) as unknown as EventLeanDoc[];

    return NextResponse.json({
      events: events.map((ev) => ({
        _id: ev._id.toString(),
        type: ev.type,
        title: ev.title,
        subject: ev.subject ?? null,
        startTime: ev.startTime ? ev.startTime.toISOString() : null,
        endTime: ev.endTime ? ev.endTime.toISOString() : null,
        deadline: ev.deadline ? ev.deadline.toISOString() : null,
        location: ev.location ?? null,
        metadata: ev.metadata ?? {},
        sourceUploadId: ev.sourceUploadId ? ev.sourceUploadId.toString() : null,
        createdAt: ev.createdAt ? ev.createdAt.toISOString() : null
      })),
      total: events.length
    });
  } catch (error) {
    console.error("Failed to fetch events", error);
    return NextResponse.json({ error: "Unable to load events" }, { status: 500 });
  }
}
