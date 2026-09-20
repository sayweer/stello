"use client";
import { useState } from "react";
import type { Copy } from "@/lib/copy";

export type CodeLabels = Copy["codeBlock"];

export default function CodeBlock({
  code,
  title = "Terminal",
  labels,
}: {
  code: string;
  title?: string;
  labels: CodeLabels;
}) {
  const [status, setStatus] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus(labels.copied);
    } catch {
      // No clipboard: over plain http, or the permission was refused.
      setStatus(labels.manual);
    }
  };

  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{title}</span>
        <button type="button" onClick={copy} aria-label={labels.aria.replace("%s", title)}>
          <span role="status">{status ?? labels.copy}</span>
        </button>
      </div>
      <pre tabIndex={0} aria-label={title}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
