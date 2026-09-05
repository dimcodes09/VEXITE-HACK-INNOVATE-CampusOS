import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to DB");
  const db = mongoose.connection.db;
  const user = await db.collection("users").findOne({ email: "divyanshukubde@gmail.com" });
  console.log("User:", user?._id);
  const college = await db.collection("colleges").findOne({ _id: user?.collegeId });
  console.log("College:", college?.name, "Chunks:", college?.policyChunks?.length);
  const events = await db.collection("events").find({ userId: user?._id }).toArray();
  console.log("Events count:", events.length);
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  console.log("Model:", modelName);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.25,
      responseMimeType: "application/json"
    }
  });
  const res = await model.generateContent('Return JSON: {"riskScore": 75, "topAction": "Attend lectures", "conflicts": []}');
  console.log("Gemini output:", res.response.text());
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("ERR:", e);
  process.exit(1);
});
