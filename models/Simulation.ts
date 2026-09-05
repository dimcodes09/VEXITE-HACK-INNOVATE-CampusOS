import { model, models, Schema, type InferSchemaType } from "mongoose";

const ProjectedTrajectorySchema = new Schema(
  {
    day: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true
    },
    note: { type: String, required: true }
  },
  { _id: false }
);

const SimulationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hypothetical: { type: String, required: true },
    projectedRiskScore: { type: Number, required: true },
    projectedTrajectory: { type: [ProjectedTrajectorySchema], required: true },
    reasoning: { type: String, required: true },
    policyCitations: { type: [String], required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: "simulations", versionKey: false }
);

SimulationSchema.index({ userId: 1, createdAt: -1 });

export type Simulation = InferSchemaType<typeof SimulationSchema>;
export const SimulationModel = models.Simulation || model<Simulation>("Simulation", SimulationSchema);
