export type Lang = "en" | "id";

export const dictionary = {
  en: {
    tagline: "Anti-spoiler AI companion",
    libraryTitle: "My Game Library",
    librarySubtitle: "Every game gets its own AI-tailored workspace.",
    addGame: "Add Game",
    emptyLibrary: "No games yet. Click + Add Game to get started.",
  },
  id: {
    tagline: "Pendamping AI anti-spoiler",
    libraryTitle: "Pustaka Game Saya",
    librarySubtitle: "Setiap game punya workspace sendiri yang disesuaikan AI.",
    addGame: "Tambah Game",
    emptyLibrary: "Belum ada game. Klik + Tambah Game untuk memulai.",
  },
} as const;

export type TextKey = keyof (typeof dictionary)["en"];
