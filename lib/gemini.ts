import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Please define the GEMINI_API_KEY environment variable.");
  }

  return new GoogleGenerativeAI(apiKey);
}
