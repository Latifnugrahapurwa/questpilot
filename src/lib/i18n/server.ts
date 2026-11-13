import { cookies } from "next/headers";

/** Mengembalikan teks tambahan untuk system prompt sesuai bahasa pilihan. */
export async function getLanguageInstruction(): Promise<string> {
  const lang = (await cookies()).get("lang")?.value;
  if (lang !== "id") return "";
  return `

IMPORTANT: Write everything in Indonesian (Bahasa Indonesia): all chat replies, the persona, quick action labels, checklist items, and progress field labels. Keep game names, character names, and in-game terms in their original form. Keep JSON keys and code in English.`;
}
