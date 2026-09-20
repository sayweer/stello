"use client";

import { fromStroops, type CampaignView } from "@stello/core";

import Words from "./Words.tsx";

/** The wordmark, split where the curtain parts. */
const BRAND_START = "Ste";
const BRAND_END = "llo";

const loaderChars = (word: string, keyBase: string) =>
  [...word].map((char, index) => (
    <span className="lp__load-char" key={`${keyBase}-${index}`}>
      {char}
    </span>
  ));

/**
 * The opening scene: a full-height section with the nav pinned to the top, the
 * headline in the middle and live numbers along the bottom edge. The curtain
 * above it is what reveals all of this — see `useReveal`.
 */
export default function Hero({
  campaigns,
  onJoin,
  onCreate,
}: {
  /** Live chain data; no invented numbers on this page. */
  campaigns: CampaignView[] | null;
  onJoin: () => void;
  onCreate: () => void;
}) {
  const totals = (campaigns ?? []).reduce(
    (sum, campaign) => ({
      raised: sum.raised + campaign.total,
      people: sum.people + campaign.pledgers,
    }),
    { raised: 0n, people: 0 },
  );

  return (
    <section className="lp__section lp__hero">
      {/* Two paper panels meeting at the wordmark's seam. The gap between them
          opens onto the hero underneath, so there is no separate splash to hand
          over from — the page is simply uncovered. */}
      <div className="lp__curtain" aria-hidden="true">
        <i className="lp__curtain-fill" />
        <div className="lp__curtain-half lp__curtain-half--l">
          <span className="lp__brand-start">{loaderChars(BRAND_START, "s")}</span>
        </div>
        <div className="lp__curtain-half lp__curtain-half--r">
          <span className="lp__brand-end">{loaderChars(BRAND_END, "e")}</span>
        </div>
      </div>

      <div className="lp__hero-top">
        <nav className="lp__nav">
          <span className="lp__nav-mask">
            <span className="lp__nav-link lp__nav-brand">Stello</span>
          </span>

          <span className="lp__nav-mid">
            {[
              ["Nasıl çalışır", "#nasil"],
              ["Para nerede", "#para"],
              ["Ya olur ya kazanırsın", "#bonus"],
            ].map(([label, href]) => (
              <span className="lp__nav-mask" key={href}>
                <a className="lp__nav-link" href={href}>
                  {label}
                </a>
              </span>
            ))}
          </span>

          <span className="lp__nav-end">
            <span className="lp__nav-mask">
              <button className="lp__nav-link" onClick={onJoin} type="button">
                Kampanyalar
              </button>
            </span>
          </span>
        </nav>
      </div>

      <div className="lp__hero-bottom">
        <div className="lp__rule" />
        <h1>
          <Words text="Ya olur, ya kazanırsın." mark="kazanırsın" />
        </h1>

        <div className="lp__rise-box">
          <p className="lp__lede lp__rise">
            Banka uygulamandan TL gönderip katıl — kripto cüzdanı gerekmez. Hedef tutarsa iş olur;
            <b> tutmazsa paran, organizatörün baştan kilitlediği bonustan payınla birlikte kendiliğinden hesabına döner.</b>
          </p>
        </div>

        <div className="lp__rise-box">
          <div className="lp__actions lp__rise">
            <button className="lp__cta" onClick={onJoin} type="button">
              Kampanyalara bak
              <span className="lp__cta-hint">katılmak için IBAN'a havale yeter</span>
            </button>
            <button className="lp__cta lp__cta--ghost" onClick={onCreate} type="button">
              Kampanya aç
            </button>
          </div>
        </div>
      </div>

      <div className="lp__hero-foot">
        <i className="lp__counter-rule" aria-hidden="true" />
        <div className="lp__rise-box">
          <div className="lp__counter lp__rise">
            <span>
              <b className="lp__num">{campaigns?.length ?? "—"}</b> kampanya
            </span>
            <span>
              <b className="lp__num">{campaigns ? fromStroops(totals.raised) : "—"}</b> USDC toplandı
            </span>
            <span>
              <b className="lp__num">{campaigns ? totals.people : "—"}</b> katılımcı
            </span>
            <span className="lp__k">Stellar testnet · canlı</span>
          </div>
        </div>
      </div>
    </section>
  );
}
