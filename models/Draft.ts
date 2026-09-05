import { model, models, Schema, type InferSchemaType } from "mongoose";

const DraftSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conflictId: { type: String, required: true },
    channel: { type: String, enum: ["email"], required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: "drafts", versionKey: false }
);

export type Draft = InferSchemaType<typeof DraftSchema>;
export const DraftModel = models.Draft || model<Draft>("Draft", DraftSchema);
