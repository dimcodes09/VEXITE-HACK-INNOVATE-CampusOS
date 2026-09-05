import { model, models, Schema, type InferSchemaType } from "mongoose";

const PolicyChunkSchema = new Schema(
  {
    section: { type: String, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], default: undefined }
  },
  { _id: false }
);

const CollegeSchema = new Schema(
  {
    name: { type: String, required: true },
    policyChunks: { type: [PolicyChunkSchema], required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: "colleges", versionKey: false }
);

export type College = InferSchemaType<typeof CollegeSchema>;
export const CollegeModel = models.College || model<College>("College", CollegeSchema);
