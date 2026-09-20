"use client";

// The product chrome: persistent sidebar (desktop) / bottom tabs (mobile) + a sticky
// topbar carrying the account this browser is using. Pages render inside.
import type { ReactNode } from "react";

import { useWallet } from "@/lib/hooks.ts";
import { shortAddr } from "./format";

export type AppPage = "campaigns" | "new";

const NAV: Record<AppPage, { label: string; icon: string }> = {
  campaigns: { label: "Kampanyalar", icon: "◈" },
  new: { label: "Kampanya aç", icon: "+" },
};
const APP_PAGES: AppPage[] = ["campaigns", "new"];

export default function AppShell({
  page,
  onGo,
  children,
}: {
  page: string;
  onGo: (view: "landing" | AppPage) => void;
  children: ReactNode;
}) {
  const { address } = useWallet();

  return (
    <div className="shell">
      <aside className="shell__side">
        <button className="shell__brand" onClick={() => onGo("landing")} type="button">
          <span className="shell__glyph" /> Stello
        </button>
        <nav className="shell__nav">
          {APP_PAGES.map((p) => (
            <button
              key={p}
              className={`shell__item${page === p ? " is-active" : ""}`}
              onClick={() => onGo(p)}
              type="button"
            >
              <span className="shell__icon">{NAV[p].icon}</span> {NAV[p].label}
            </button>
          ))}
        </nav>
        <div className="shell__foot">
          <div className="shell__testnet">⚠ Test ağı — test parası, gerçek para değil.</div>
          <a
            className="shell__docs"
            href="https://github.com/sayweer/stello#readme"
            target="_blank"
            rel="noreferrer"
          >
            Nasıl çalışıyor ↗
          </a>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__top">
          <div className="tswitch">
            <button className="tswitch__chip" onClick={() => onGo("campaigns")} type="button">
              Tüm kampanyalar
            </button>
          </div>
          <div className="tswitch">
            <span className="tswitch__chip" style={{ cursor: "default" }}>
              {address ? shortAddr(address) : "henüz hesap yok"}
            </span>
          </div>
        </header>
        <main className="shell__content">{children}</main>
      </div>

      <nav className="shell__tabs">
        {APP_PAGES.map((p) => (
          <button
            key={p}
            className={`shell__tab${page === p ? " is-active" : ""}`}
            onClick={() => onGo(p)}
            type="button"
          >
            <span className="shell__icon">{NAV[p].icon}</span>
            {NAV[p].label}
          </button>
        ))}
      </nav>
    </div>
  );
}
