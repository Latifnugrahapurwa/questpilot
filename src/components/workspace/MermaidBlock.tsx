"use client";

import { useEffect, useId, useState } from "react";

export default function MermaidBlock({ code }: { code: string }) {
  const id = "mmd-" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Wait a beat so partially-streamed diagrams don't flash errors.
    const t = setTimeout(async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(svg);
          setFailed(false);
        }
      } catch {
        document.getElementById("d" + id)?.remove();
        if (!cancelled) setFailed(true);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [code, id]);

  if (failed)
    return (
      <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
        <code>{code}</code>
      </pre>
    );
  if (!svg) return <div className="my-2 h-16 animate-pulse rounded-lg bg-zinc-900" />;
  return <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-3" dangerouslySetInnerHTML={{ __html: svg }} />;
}
