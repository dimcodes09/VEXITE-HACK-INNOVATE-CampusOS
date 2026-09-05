import { model, models, Schema, type InferSchemaType } from "mongoose";

const UploadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    originalFilename: { type: String, default: null },
    mimeType: { type: String, required: true },
    geminiRawResponse: { type: Schema.Types.Mixed, required: true },
    eventsExtractedCount: { type: Number, required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: "uploads", versionKey: false }
);

export type Upload = InferSchemaType<typeof UploadSchema>;
export const UploadModel = models.Upload || model<Upload>("Upload", UploadSchema);
