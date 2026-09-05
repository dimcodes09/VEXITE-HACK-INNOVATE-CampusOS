import { model, models, Schema, type InferSchemaType } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: "chat_messages", versionKey: false }
);

ChatMessageSchema.index({ userId: 1, createdAt: 1 });

export type ChatMessage = InferSchemaType<typeof ChatMessageSchema>;
export const ChatMessageModel =
  models.ChatMessage || model<ChatMessage>("ChatMessage", ChatMessageSchema);
