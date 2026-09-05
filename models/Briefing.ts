import { model, models, Schema, type InferSchemaType } from "mongoose";

const ConflictSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true
    },
    reasoningChain: { type: String, required: true },
    policyCitation: { type: String, default: null },
    relatedEventIds: [{ type: Schema.Types.Mixed, default: [] }],
    suggestedAction: { type: String, required: true },
    draftableResolution: { type: Schema.Types.Mixed, default: false }
  },
  { _id: false }
);

const ToolCallLogSchema = new Schema(
  {
    tool: { type: String, required: true },
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const BriefingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    riskScore: { type: Number, required: true },
    topAction: { type: String, required: true },
    conflicts: { type: [ConflictSchema], required: true },
    toolCallLog: { type: [ToolCallLogSchema], required: true },
    generatedAt: { type: Date, required: true }
  },
  { collection: "briefings", versionKey: false }
);

BriefingSchema.index({ userId: 1, generatedAt: -1 });

export type Briefing = InferSchemaType<typeof BriefingSchema>;
export const BriefingModel = models.Briefing || model<Briefing>("Briefing", BriefingSchema);
