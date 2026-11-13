"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Loader2, RefreshCw, Settings, X } from "lucide-react";
import { clearKeys, EMPTY_KEYS, loadKeys, saveKeys, type ApiKeys, type Provider } from "@/lib/keys";

type ModelOption = { id: string; label: string };

const PROVIDERS: { id: Provider; label: string; keyLabel: string; link: string; hint: string }[] = [
  { id: "google", label: "Gemini (Google)", keyLabel: "Gemini API key", link: "https://aistudio.google.com/apikey", hint: "Dari Google AI Studio." },
  {
    id: "openai",
    label: "ChatGPT (OpenAI)",
    keyLabel: "OpenAI API key",
    link: "https://platform.openai.com/api-keys",
    hint: "Harus API key dari platform.openai.com dengan saldo billing. Langganan ChatGPT Plus tidak berlaku untuk API.",
  },
  { id: "anthropic", label: "Claude (Anthropic)", keyLabel: "Anthropic API key", link: "https://console.anthropic.com/settings/keys", hint: "Dari Anthropic Console, perlu kredit API." },
  {
    id: "custom",
    label: "OpenAI-compatible (OpenRouter, Groq, DeepSeek, dll)",
    keyLabel: "API key",
    link: "https://openrouter.ai/keys",
    hint: "Untuk layanan apa pun yang meniru API OpenAI. Isi Base URL dan nama model. Pembuatan workspace butuh dukungan structured output dari layanan tersebut.",
  },
];

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cfg, setCfg] = useState<ApiKeys>(EMPTY_KEYS);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const provider = cfg.provider;
  const meta = PROVIDERS.find((p) => p.id === provider)!;
  const activeKey = cfg.keys[provider];
  const activeModel = cfg.models[provider];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setCfg(loadKeys());
      setSaved(false);
    }
  }, [open]);

  const loadModels = useCallback(async (p: Provider, key: string, baseUrl: string) => {
    setModels([]);
    if (!key.trim() || (p === "custom" && !baseUrl.trim())) {
      setModelError(null);
      return;
    }
    setLoadingModels(true);
    setModelError(null);
    try {
      const headers: Record<string, string> = { "x-ai-provider": p, "x-ai-key": key.trim() };
      if (p === "custom") headers["x-ai-base-url"] = baseUrl.trim();
      const res = await fetch("/api/models", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat model");
      setModels(json.models ?? []);
    } catch (e) {
      setModelError(e instanceof Error ? e.message : "Gagal memuat model");
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // Refresh the model list when provider / key / base URL changes (debounced).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadModels(provider, activeKey, cfg.baseUrl), 600);
    return () => clearTimeout(t);
  }, [open, provider, activeKey, cfg.baseUrl, loadModels]);

  const update = (patch: Partial<ApiKeys>) => {
    setCfg((p) => ({ ...p, ...patch }));
    setSaved(false);
  };
  const setKey = (v: string) => update({ keys: { ...cfg.keys, [provider]: v } });
  const setModel = (v: string) => update({ models: { ...cfg.models, [provider]: v } });

  const savedModelMissing = provider !== "custom" && activeModel && models.length > 0 && !models.some((m) => m.id === activeModel);
  const inputCls = "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs outline-none focus:border-amber-500";

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Pengaturan" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400">
        <Settings className="h-5 w-5" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-12" onClick={() => setOpen(false)}>
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

              <div className="space-y-4">
                <section className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Penyedia AI</h3>

                  <label className="block">
                    <span className="text-xs font-medium text-amber-400">AI yang digunakan</span>
                    <select
                      value={provider}
                      onChange={(e) => update({ provider: e.target.value as Provider })}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-amber-500"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-400">{meta.keyLabel}</span>
                      <a href={meta.link} target="_blank" rel="noreferrer" className="text-emerald-400 underline">
                        Dapatkan key
                      </a>
                    </span>
                    <input type={show ? "text" : "password"} value={activeKey} onChange={(e) => setKey(e.target.value)} autoComplete="off" spellCheck={false} className={inputCls} />
                    <span className="text-[11px] text-zinc-500">{meta.hint}</span>
                  </label>

                  {provider === "custom" && (
                    <label className="block">
                      <span className="text-xs font-medium text-amber-400">Base URL</span>
                      <input
                        value={cfg.baseUrl}
                        onChange={(e) => update({ baseUrl: e.target.value })}
                        placeholder="https://openrouter.ai/api/v1"
                        autoComplete="off"
                        spellCheck={false}
                        className={inputCls}
                      />
                    </label>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-400">Model</span>
                      <button
                        type="button"
                        onClick={() => loadModels(provider, activeKey, cfg.baseUrl)}
                        disabled={loadingModels || !activeKey.trim()}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                      >
                        {loadingModels ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Muat ulang daftar
                      </button>
                    </div>

                    {provider === "custom" ? (
                      <>
                        <input
                          list="qp-models"
                          value={activeModel}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="mis. openai/gpt-4o-mini"
                          spellCheck={false}
                          className={inputCls}
                        />
                        <datalist id="qp-models">
                          {models.map((m) => (
                            <option key={m.id} value={m.id} />
                          ))}
                        </datalist>
                      </>
                    ) : (
                      <select
                        value={activeModel}
                        onChange={(e) => setModel(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-amber-500"
                      >
                        <option value="">Otomatis: pilihan terbaik untuk key ini (disarankan)</option>
                        {savedModelMissing && <option value={activeModel}>{activeModel} (tidak tersedia untuk key ini)</option>}
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label === m.id ? m.id : `${m.label} (${m.id})`}
                          </option>
                        ))}
                      </select>
                    )}

                    <span className={`text-[11px] ${modelError ? "text-red-400" : "text-zinc-500"}`}>
                      {modelError
                        ? modelError
                        : loadingModels
                          ? "Memuat daftar model…"
                          : models.length
                            ? `${models.length} model tersedia untuk key ini.`
                            : "Isi key untuk memuat daftar model yang tersedia."}
                    </span>
                  </div>
                </section>

                <section className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Data game & gambar</h3>
                  <label className="block">
                    <span className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-400">RAWG API key</span>
                      <a href="https://rawg.io/apidocs" target="_blank" rel="noreferrer" className="text-emerald-400 underline">
                        Dapatkan key
                      </a>
                    </span>
                    <input type={show ? "text" : "password"} value={cfg.rawg} onChange={(e) => update({ rawg: e.target.value })} autoComplete="off" spellCheck={false} className={inputCls} />
                    <span className="text-[11px] text-zinc-500">Disarankan. Tanpa ini pencarian memakai Steam (tanpa genre).</span>
                  </label>
                  <label className="block">
                    <span className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-400">Serper API key</span>
                      <a href="https://serper.dev" target="_blank" rel="noreferrer" className="text-emerald-400 underline">
                        Dapatkan key
                      </a>
                    </span>
                    <input type={show ? "text" : "password"} value={cfg.serper} onChange={(e) => update({ serper: e.target.value })} autoComplete="off" spellCheck={false} className={inputCls} />
                    <span className="text-[11px] text-zinc-500">Opsional. Untuk gambar referensi di chat.</span>
                  </label>
                </section>
              </div>

              <button onClick={() => setShow((s) => !s)} className="mt-3 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
                {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {show ? "Sembunyikan key" : "Tampilkan key"}
              </button>

              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => {
                    clearKeys();
                    setCfg(EMPTY_KEYS);
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
                      saveKeys(cfg);
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
