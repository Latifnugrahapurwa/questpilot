import { z } from "zod";

// Array size limits are described in text (and clamped in the route) instead of using
// minItems/maxItems, because some providers' structured-output modes reject those keywords.
export const workspaceConfigSchema = z.object({
  persona: z.string().describe("One-paragraph persona/tone for the AI guide, tailored to this game's genre."),
  progress_fields: z
    .array(
      z.object({
        key: z.string().describe("snake_case key"),
        label: z.string(),
        placeholder: z.string(),
      }),
    )
    .describe("2 to 5 genre-appropriate progress trackers (e.g. Chapter, Day, Level, Build, Rank)."),
  quick_actions: z
    .array(
      z.object({
        label: z.string().describe("Short button label, max 4 words"),
        prompt: z.string().describe("Full prompt sent to the guide when clicked"),
        icon: z
          .enum(["map", "sword", "hammer", "book", "lightbulb", "target", "package", "compass", "wrench", "trending-up", "shield", "sparkles"])
          .describe("Icon name"),
      }),
    )
    .describe("Exactly 4 quick actions."),
  starter_checklist: z
    .array(z.object({ text: z.string() }))
    .describe("4 to 8 spoiler-free starter goals/habits for a new player."),
});
