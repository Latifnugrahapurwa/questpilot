"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Settings, X } from "lucide-react";
import { clearKeys, loadKeys, saveKeys, type ApiKeys } from "@/lib/keys";

const FIELDS: { id: keyof Omit<ApiKeys, "model">; label: string; hint: string; link: string }[] = [
  { id: "gemini", label: "Gemini API key", hint: "Wajib. Untuk chat dan pembuatan workspace.", link: "https://aistudio.google.com/apikey" },
  { id: "rawg", label: "RAWG API key", hint: "Wajib. Untuk pencarian game dan cover.", link: "https://rawg.io/apidocs" },
  { id: "serper", label: "Serper API key", hint: "Opsional. Untuk gambar referensi di chat.", link: "https://serper.dev" },
];

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<ApiKeys>({ gemini: "", rawg: "", serper: "", model: "" });
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setKeys(loadKeys());
      setSaved(false);
    }
  }, [open]);

  const set = (k: keyof ApiKeys, v: string) => {
    setKeys((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Pengaturan" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400">
        <Settings className="h-5 w-5" />
      </button>

      {open && mounted && createPortal(
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

              <label className="block">
                <span className="text-xs font-medium text-amber-400">Model Gemini</span>
                <input
                  value={keys.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="gemini-2.5-flash (bawaan)"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs outline-none focus:border-amber-500"
                />
              </label>
            </div>

            <button onClick={() => setShow((s) => !s)} className="mt-3 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {show ? "Sembunyikan key" : "Tampilkan key"}
            </button>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => {
                  clearKeys();
                  setKeys({ gemini: "", rawg: "", serper: "", model: "" });
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
