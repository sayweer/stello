"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import StelloMark from "./StelloMark";
// The type import is erased at build time; the value import is the one that
// must avoid the dictionaries, so it comes from the data-free module.
import type { Copy } from "@/lib/copy";
import { type Lang, otherLang, swapLang } from "@/lib/copy/lang";

export default function SiteHeader({ lang, chrome }: { lang: Lang; chrome: Copy["chrome"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const toggleTheme = () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("stello-theme", theme);
    } catch {
      /* The theme still works without storage. */
    }
  };

  const other = otherLang(lang);
  const docsHref = `/${lang}/docs`;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={`/${lang}`} onClick={close} aria-label={chrome.brandHome}>
          <StelloMark size={28} />
          <span>Stello</span>
          <span className="brand-label">SDK</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(!open)}
        >
          {chrome.menu} {open ? "−" : "+"}
        </button>
        <nav
          id="site-nav"
          className={`site-nav${open ? " is-open" : ""}`}
          aria-label={chrome.mainMenu}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <Link
            href={docsHref}
            aria-current={pathname.startsWith(docsHref) ? "page" : undefined}
            onClick={close}
          >
            {chrome.docs}
          </Link>
          <Link href={`/${lang}/docs/example`} onClick={close}>
            {chrome.example}
          </Link>
          <a href="https://github.com/sayweer/stello" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          {/* Keeps the reader on the page they are reading, in the other language. */}
          <Link
            className="lang-toggle"
            href={swapLang(pathname, other)}
            onClick={close}
            aria-label={chrome.langToggle}
            lang={other}
          >
            {other.toUpperCase()}
          </Link>
          <button
            className="theme-toggle"
            type="button"
            aria-label={chrome.themeToggle}
            onClick={toggleTheme}
          >
            <span aria-hidden="true">◐</span>
          </button>
          <Link
            className="button primary small"
            href={`/${lang}/docs/installation`}
            onClick={close}
          >
            {chrome.start} ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
