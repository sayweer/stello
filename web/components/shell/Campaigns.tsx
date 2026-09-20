"use client";

import { fromStroops, Status, type CampaignView } from "@stello/core";

import { useCampaignList } from "@/lib/hooks.ts";

/** "3 gün 4 saat", "18 dakika", "süre doldu" — never a raw timestamp. */
function timeLeft(seconds: number): string {
  if (seconds <= 0) return "süre doldu";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} gün ${hours} saat`;
  if (hours) return `${hours} saat ${minutes} dk`;
  return `${minutes} dk`;
}

function statusTag(campaign: CampaignView) {
  if (campaign.status === Status.Succeeded) return <span className="tag">Hedef tuttu</span>;
  if (campaign.status === Status.Failed) {
    return <span className="tag tag--failed">Tutmadı · paran geri</span>;
  }
  // Still Open on-chain, but the deadline has passed: the first claim or a
  // settle call will close it.
  if (campaign.secondsLeft === 0) return <span className="tag">Sonuç bekleniyor</span>;
  if (!campaign.live) return <span className="tag">Bonus bekleniyor</span>;
  return <span className="tag tag--live">Açık</span>;
}

export default function Campaigns() {
  const campaigns = useCampaignList();

  return (
    <>
      <div className="page__head">
        <p className="lp__k">Kampanyalar</p>
        <h1 className="page__title">Yeterli kişi çıkarsa olacak işler</h1>
        <p className="page__lede">
          Katılmak için havale yeter. Hedef tutmazsa paran ve bonustan payın kendiliğinden döner.
        </p>
      </div>

      {campaigns === null ? (
        <div className="empty">Zincirden okunuyor…</div>
      ) : campaigns.length === 0 ? (
        <div className="empty">
          Henüz kampanya yok. İlkini sen açabilirsin.
        </div>
      ) : (
        <div className="grid">
          {campaigns.map((campaign) => (
            <button
              key={String(campaign.id)}
              className="ccard"
              type="button"
              onClick={() => {
                window.location.hash = `campaigns`;
              }}
            >
              <h2 className="ccard__title">{campaign.title}</h2>
              <div className="ccard__meta">
                {statusTag(campaign)}
                <span>{timeLeft(campaign.secondsLeft)}</span>
              </div>

              <div className="bar">
                <span style={{ width: `${Math.min(100, campaign.percent)}%` }} />
              </div>

              <div className="ccard__meta">
                <span className="lp__num">
                  {fromStroops(campaign.total)} / {fromStroops(campaign.goal)} USDC
                </span>
                <span>{campaign.pledgers} kişi</span>
                {campaign.bonus > 0n && (
                  <span className="lp__num">bonus {fromStroops(campaign.bonus)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
