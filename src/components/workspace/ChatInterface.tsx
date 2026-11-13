"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Send } from "lucide-react";
import type { QuickAction, StoredToolInvocation } from "@/lib/types";
import { keyHeaders } from "@/lib/keys";
import QuickActionsBar from "./QuickActionsBar";
import MermaidBlock from "./MermaidBlock";
import VisualImageGrid from "./VisualImageGrid";

type Props = { gameId: string; gameTitle: string; quickActions: QuickAction[]; initialMessages: UIMessage[] };

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
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { gameId }, headers: () => keyHeaders() }), [gameId]);
  const { messages, sendMessage, status, error } = useChat({ transport, messages: initialMessages });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <section className="flex h-[70vh] flex-col rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-3">
        <QuickActionsBar actions={quickActions} disabled={busy} onPick={send} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-zinc-500">
            Ask anything about {gameTitle}. Set your progress above to keep answers spoiler-free.
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl bg-amber-500 px-3 py-2 text-sm text-zinc-950" : "w-full"}>
              {m.parts.map((p, i) => {
                if (p.type === "text") return m.role === "user" ? <span key={i}>{p.text}</span> : <Markdown key={i} text={p.text} />;
                if (p.type === "tool-searchGameVisuals") {
                  if (p.state === "output-available") {
                    const out = p.output as StoredToolInvocation;
                    return <VisualImageGrid key={i} images={out.images ?? []} query={out.query} />;
                  }
                  return (
                    <p key={i} className="flex items-center gap-1 text-xs text-zinc-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> Finding visual references…
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {status === "submitted" && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
        {error && <p className="text-sm text-red-400">Error: {error.message}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-zinc-800 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${gameTitle}…`}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
        <button disabled={busy || !input.trim()} className="rounded-lg bg-amber-500 px-3 text-zinc-950 hover:bg-amber-400 disabled:opacity-50" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
