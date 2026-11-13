import { google } from "@ai-sdk/google";

// Switch models by changing AI_MODEL (e.g. "gemini-2.5-pro") or swapping the provider here.
export const getModel = () => google(process.env.AI_MODEL || "gemini-2.5-flash");
