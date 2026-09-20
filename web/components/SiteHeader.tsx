"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import StelloMark from "./StelloMark";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleTheme = () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("stello-theme", theme); } catch { /* The theme still works without storage. */ }
  };
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" href="/" onClick={() => setOpen(false)} aria-label="Stello ana sayfa"><StelloMark size={28} /><span>Stello</span><span className="brand-label">SDK</span></Link>
    <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>Menü {open ? "−" : "+"}</button>
    <nav id="site-nav" className={`site-nav${open ? " is-open" : ""}`} aria-label="Ana menü" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <Link href="/docs" aria-current={pathname.startsWith("/docs") ? "page" : undefined} onClick={() => setOpen(false)}>Dokümantasyon</Link>
      <Link href="/docs/example" onClick={() => setOpen(false)}>Örnek uygulama</Link>
      <a href="https://github.com/sayweer/stello" target="_blank" rel="noreferrer">GitHub ↗</a>
      <button className="theme-toggle" type="button" aria-label="Açık ve koyu tema arasında geçiş yap" onClick={toggleTheme}><span aria-hidden="true">◐</span></button>
      <Link className="button primary small" href="/docs/installation" onClick={() => setOpen(false)}>Başla ↗</Link>
    </nav>
  </div></header>;
}
