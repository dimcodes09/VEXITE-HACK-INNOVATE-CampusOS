import { model, models, Schema, type InferSchemaType } from "mongoose";

const EventMetadataSchema = new Schema(
  {
    attendancePercent: { type: Number, default: null },
    estimatedEffortHours: { type: Number, default: null },
    sourceFileType: {
      type: String,
      enum: ["image", "pdf", "text"],
      required: true
    },
    rawExtractionNotes: { type: String, default: null }
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["class", "assignment", "exam", "hackathon", "notice", "attendance_record"],
      required: true
    },
    title: { type: String, required: true },
    subject: { type: String, default: null },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    deadline: { type: Date, default: null },
    location: { type: String, default: null },
    metadata: { type: EventMetadataSchema, required: true },
    sourceUploadId: { type: Schema.Types.ObjectId, ref: "Upload", required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: "events", versionKey: false }
);

EventSchema.index({ userId: 1, startTime: 1 });
EventSchema.index({ userId: 1, deadline: 1 });

export type Event = InferSchemaType<typeof EventSchema>;
export const EventModel = models.Event || model<Event>("Event", EventSchema);
