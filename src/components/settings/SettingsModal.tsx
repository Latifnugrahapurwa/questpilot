"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Loader2, RefreshCw, Settings, X } from "lucide-react";
import { clearKeys, loadKeys, saveKeys, type ApiKeys } from "@/lib/keys";

type ModelOption = { id: string; label: string };

const FIELDS: { id: keyof Omit<ApiKeys, "model">; label: string; hint: string; link: string }[] = [
  { id: "gemini", label: "Gemini API key", hint: "Wajib. Untuk chat dan pembuatan workspace.", link: "https://aistudio.google.com/apikey" },
  { id: "rawg", label: "RAWG API key", hint: "Disarankan. Untuk pencarian game, genre, dan cover. Tanpa ini dipakai pencarian Steam.", link: "https://rawg.io/apidocs" },
  { id: "serper", label: "Serper API key", hint: "Opsional. Untuk gambar referensi di chat.", link: "https://serper.dev" },
];

const EMPTY: ApiKeys = { gemini: "", rawg: "", serper: "", model: "" };

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [keys, setKeys] = useState<ApiKeys>(EMPTY);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setKeys(loadKeys());
      setSaved(false);
    }
  }, [open]);

  const loadModels = useCallback(async (geminiKey: string) => {
    if (!geminiKey.trim()) {
      setModels([]);
      setModelError(null);
      return;
    }
    setLoadingModels(true);
    setModelError(null);
    try {
      const res = await fetch("/api/models", { headers: { "x-gemini-key": geminiKey.trim() } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat model");
      setModels(json.models ?? []);
    } catch (e) {
      setModels([]);
      setModelError(e instanceof Error ? e.message : "Gagal memuat model");
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // Refresh the model list whenever the Gemini key changes (debounced).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadModels(keys.gemini), 600);
    return () => clearTimeout(t);
  }, [open, keys.gemini, loadModels]);

  const set = (k: keyof ApiKeys, v: string) => {
    setKeys((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const savedModelMissing = keys.model && models.length > 0 && !models.some((m) => m.id === keys.model);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Pengaturan" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400">
        <Settings className="h-5 w-5" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16" onClick={() => setOpen(false)}>
            <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-semibold">Pengaturan API</h2>
                <button onClick={() => setOpen(false)} aria-label="Tutup">
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
              <p className="mb-4 text-xs text-zinc-500">
                Key disimpan hanya di browser ini (localStorage) dan dikirim lewat HTTPS ke server aplikasi ini untuk meneruskan request ke penyedia. Server tidak menyimpannya. Jika kosong, aplikasi memakai environment variable di Vercel.
              </p>

              <div className="space-y-3">
                {FIELDS.map((f) => (
                  <label key={f.id} className="block">
                    <span className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-400">{f.label}</span>
                      <a href={f.link} target="_blank" rel="noreferrer" className="text-emerald-400 underline">
                        Dapatkan key
                      </a>
                    </span>
                    <input
                      type={show ? "text" : "password"}
                      value={keys[f.id]}
                      onChange={(e) => set(f.id, e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-zinc-500">{f.hint}</span>
                  </label>
                ))}

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-amber-400">Model Gemini</span>
                    <button
                      type="button"
                      onClick={() => loadModels(keys.gemini)}
                      disabled={loadingModels || !keys.gemini.trim()}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                    >
                      {loadingModels ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Muat ulang daftar
                    </button>
                  </div>
                  <select
                    value={keys.model}
                    onChange={(e) => set("model", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="">Otomatis: Flash terbaru untuk key ini (disarankan)</option>
                    {savedModelMissing && <option value={keys.model}>{keys.model} (tidak tersedia untuk key ini)</option>}
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.id})
                      </option>
                    ))}
                  </select>
                  <span className={`text-[11px] ${modelError ? "text-red-400" : "text-zinc-500"}`}>
                    {modelError
                      ? modelError
                      : loadingModels
                        ? "Memuat daftar model dari Google…"
                        : models.length
                          ? `${models.length} model tersedia untuk key ini.`
                          : "Isi Gemini API key untuk memuat daftar model yang tersedia."}
                  </span>
                </div>
              </div>

              <button onClick={() => setShow((s) => !s)} className="mt-3 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
                {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {show ? "Sembunyikan key" : "Tampilkan key"}
              </button>

              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => {
                    clearKeys();
                    setKeys(EMPTY);
                    setModels([]);
                    setSaved(false);
                  }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Hapus semua key
                </button>
                <div className="flex items-center gap-3">
                  {saved && <span className="text-xs text-emerald-400">Tersimpan</span>}
                  <button
                    onClick={() => {
                      saveKeys(keys);
                      setSaved(true);
                    }}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
