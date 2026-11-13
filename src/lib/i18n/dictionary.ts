export type Lang = "en" | "id";

export const dictionary = {
  en: {
    tagline: "Anti-spoiler AI companion",
    libraryTitle: "My Game Library",
    librarySubtitle: "Every game gets its own AI-tailored workspace.",
    addGame: "Add Game",
    emptyLibrary: "No games yet. Click + Add Game to get started.",
    manageGames: "Manage games",
    manageTitle: "Manage Games",
    manageSubtitle: "Delete games you no longer need. This also removes their workspace data.",
    deleteGame: "Delete",
    deleting: "Deleting...",
    confirmDelete: "Delete this game and all of its workspace data? This cannot be undone.",
    noGamesManage: "There are no games to manage.",
    backToLibrary: "Back to library",
    loading: "Loading...",
    loadFailed: "Failed to load games.",
    deleteFailed: "Failed to delete the game.",
  },
  id: {
    tagline: "Pendamping AI anti-spoiler",
    libraryTitle: "Pustaka Game Saya",
    librarySubtitle: "Setiap game punya workspace sendiri yang disesuaikan AI.",
    addGame: "Tambah Game",
    emptyLibrary: "Belum ada game. Klik + Tambah Game untuk memulai.",
    manageGames: "Kelola game",
    manageTitle: "Kelola Game",
    manageSubtitle: "Hapus game yang tidak dipakai lagi. Data workspace-nya ikut terhapus.",
    deleteGame: "Hapus",
    deleting: "Menghapus...",
    confirmDelete: "Hapus game ini beserta seluruh data workspace-nya? Tindakan ini tidak bisa dibatalkan.",
    noGamesManage: "Belum ada game yang bisa dikelola.",
    backToLibrary: "Kembali ke pustaka",
    loading: "Memuat...",
    loadFailed: "Gagal memuat daftar game.",
    deleteFailed: "Gagal menghapus game.",
  },
} as const;

export type TextKey = keyof (typeof dictionary)["en"];
