import { model, models, Schema, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    googleId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", default: undefined },
    createdAt: { type: Date, required: true }
  },
  { collection: "users", versionKey: false }
);

export type User = InferSchemaType<typeof UserSchema>;
export const UserModel = models.User || model<User>("User", UserSchema);
