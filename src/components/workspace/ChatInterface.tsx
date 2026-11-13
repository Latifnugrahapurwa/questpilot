"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import type { QuickAction, StoredToolInvocation } from "@/lib/types";
import { keyHeaders } from "@/lib/keys";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import QuickActionsBar from "./QuickActionsBar";
import MermaidBlock from "./MermaidBlock";
import VisualImageGrid from "./VisualImageGrid";

type Props = { gameId: string; gameTitle: string; quickActions: QuickAction[]; initialMessages: UIMessage[] };

type AttachedImage = { id: string; name: string; url: string };

const MAX_IMAGES = 4;
const MAX_DIMENSION = 1600;

// Perkecil gambar di browser supaya request ke server tidak terlalu besar.
async function toCompressedDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image load failed"));
      el.src = objectUrl;
    });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-qp">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const lang = /language-(\w+)/.exec(className || "")?.[1];
            const code = String(children).replace(/\n$/, "");
            if (lang === "mermaid") return <MermaidBlock code={code} />;
            if (lang || code.includes("\n"))
              return (
                <pre>
                  <code>{code}</code>
                </pre>
              );
            return <code>{children}</code>;
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatInterface({ gameId, gameTitle, quickActions, initialMessages }: Props) {
  const { t } = useLanguage();
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { gameId }, headers: () => keyHeaders() }), [gameId]);
  const { messages, sendMessage, status, error } = useChat({ transport, messages: initialMessages });
  const [input, setInput] = useState("");
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  async function addFiles(list: File[]) {
    setAttachError(null);
    const imageFiles = list.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const slots = MAX_IMAGES - images.length;
    if (slots <= 0) {
      setAttachError(t("maxImages"));
      return;
    }
    if (imageFiles.length > slots) setAttachError(t("maxImages"));

    const added: AttachedImage[] = [];
    for (const file of imageFiles.slice(0, slots)) {
      try {
        const url = await toCompressedDataUrl(file);
        added.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: file.name || "image.jpg", url });
      } catch {
        setAttachError(t("imageFailed"));
      }
    }
    if (added.length) setImages((prev) => [...prev, ...added].slice(0, MAX_IMAGES));
  }

  function send(text: string, attached: AttachedImage[] = []) {
    const trimmed = text.trim();
    if ((!trimmed && attached.length === 0) || busy) return;

    const files = attached.map((img) => ({
      type: "file" as const,
      mediaType: "image/jpeg",
      filename: img.name.replace(/\.[^.]+$/, "") + ".jpg",
      url: img.url,
    }));

    if (files.length > 0) {
      sendMessage({ text: trimmed || t("analyzeImage"), files });
    } else {
      sendMessage({ text: trimmed });
    }
    setInput("");
    setImages([]);
    setAttachError(null);
  }

  function onPaste(e: React.ClipboardEvent) {
    const pasted: File[] = [];
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length > 0) {
      e.preventDefault();
      void addFiles(pasted);
    }
  }

  return (
    <section
      className={`flex h-[70vh] flex-col rounded-xl border bg-zinc-900 ${dragging ? "border-amber-500" : "border-zinc-800"}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="border-b border-zinc-800 p-3">
        <QuickActionsBar actions={quickActions} disabled={busy} onPick={(q) => send(q)} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-zinc-500">
            {t("askEmpty").replace("{game}", gameTitle)}
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl bg-amber-500 px-3 py-2 text-sm text-zinc-950" : "w-full"}>
              {m.parts.map((p, i) => {
                if (p.type === "text") return m.role === "user" ? <span key={i}>{p.text}</span> : <Markdown key={i} text={p.text} />;
                if (p.type === "file" && p.mediaType?.startsWith("image/")) {
                  return (
                    <img
                      key={i}
                      src={p.url}
                      alt={p.filename ?? "image"}
                      className="mb-2 block max-h-56 max-w-full rounded-lg border border-black/10"
                    />
                  );
                }
                if (p.type === "tool-searchGameVisuals") {
                  if (p.state === "output-available") {
                    const out = p.output as StoredToolInvocation;
                    return <VisualImageGrid key={i} images={out.images ?? []} query={out.query} />;
                  }
                  return (
                    <p key={i} className="flex items-center gap-1 text-xs text-zinc-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> {t("findingVisuals")}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {status === "submitted" && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
        {error && <p className="text-sm text-red-400">{t("errorLabel")} {error.message}</p>}
        <div ref={endRef} />
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 px-3 pt-3">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <img src={img.url} alt={img.name} className="h-16 w-16 rounded-lg border border-zinc-700 object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((x) => x.id !== img.id))}
                aria-label={t("removeImage")}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-zinc-950 p-0.5 text-zinc-300 ring-1 ring-zinc-700 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {attachError && <p className="px-3 pt-2 text-xs text-red-400">{attachError}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input, images);
        }}
        className="flex gap-2 border-t border-zinc-800 p-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || images.length >= MAX_IMAGES}
          title={t("attachImage")}
          aria-label={t("attachImage")}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-300 hover:border-amber-500 hover:text-amber-400 disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={onPaste}
          placeholder={t("askPlaceholder").replace("{game}", gameTitle)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
        <button
          disabled={busy || (!input.trim() && images.length === 0)}
          className="rounded-lg bg-amber-500 px-3 text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          aria-label={t("sendLabel")}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
