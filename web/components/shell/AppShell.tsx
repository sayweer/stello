"use client";

import { config } from "@stello/core";

import Campaigns from "./Campaigns.tsx";
import { useWallet } from "@/lib/hooks.ts";

/**
 * The product chrome: a sidebar on a desktop, bottom tabs on a phone, and a
 * sticky bar naming the account this browser is using. Pages render inside.
 */
const NAV = [
  { key: "campaigns", label: "Kampanyalar", icon: "≡" },
  { key: "new", label: "Kampanya aç", icon: "+" },
] as const;

export default function AppShell({
  view,
  onGo,
}: {
  view: string;
  onGo: (view: "landing" | "campaigns" | "new") => void;
}) {
  const { address } = useWallet();

  return (
    <div className="shell">
      <aside className="shell__side">
        <button className="shell__brand" onClick={() => onGo("landing")} type="button">
          Stello
        </button>

        <nav className="shell__nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              className={`shell__item${view === item.key ? " is-active" : ""}`}
              onClick={() => onGo(item.key)}
              type="button"
            >
              <span className="shell__icon">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="shell__foot">
          <div className="shell__testnet">
            Stellar testnet — gerçek para değil, test USDC'si.
          </div>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${config.campaignId}`}
            target="_blank"
            rel="noreferrer"
          >
            Kontratı gör ↗
          </a>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__top">
          <span className="shell__who">
            {address ? (
              <>
                <i className="shell__dot" />
                {address.slice(0, 4)}…{address.slice(-4)}
              </>
            ) : (
              "Henüz hesap açılmadı"
            )}
          </span>
          <button className="lp__cta lp__cta--ghost" onClick={() => onGo("landing")} type="button">
            Ana sayfa
          </button>
        </header>

        <main className="shell__content">
          {view === "new" ? (
            <div className="page__head">
              <p className="lp__k">Organizatör</p>
              <h1 className="page__title">Kampanya aç</h1>
              <p className="page__lede">Bu ekran sırada — önce katılım tarafını bitiriyoruz.</p>
            </div>
          ) : (
            <Campaigns />
          )}
        </main>
      </div>

      <nav className="shell__tabs">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`shell__tab${view === item.key ? " is-active" : ""}`}
            onClick={() => onGo(item.key)}
            type="button"
          >
            <span className="shell__icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
