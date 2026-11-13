import { z } from "zod";

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
    .min(2)
    .max(5)
    .describe("Genre-appropriate progress trackers (e.g. Chapter, Day, Level, Build, Rank)."),
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
    .length(4),
  starter_checklist: z
    .array(z.object({ text: z.string() }))
    .min(4)
    .max(8)
    .describe("Spoiler-free starter goals/habits for a new player."),
});
