"use client";
import { useState } from "react";

export default function CodeBlock({ code, title = "Terminal" }: { code: string; title?: string }) {
  const [status, setStatus] = useState("Kopyala");
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setStatus("Kopyalandı"); }
    catch { setStatus("Seçerek kopyala"); }
  };
  return <div className="code-block"><div className="code-toolbar"><span>{title}</span><button type="button" onClick={copy} aria-label={`${title} kodunu kopyala`}><span role="status">{status}</span></button></div><pre tabIndex={0} aria-label={title}><code>{code}</code></pre></div>;
}
