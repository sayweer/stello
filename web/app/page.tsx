"use client";

import { useCampaignList } from "@/lib/hooks.ts";

/**
 * Placeholder list — the visual design comes from the reference UI we are
 * adapting; this only proves the data layer reaches the chain.
 */
export default function Home() {
  const campaigns = useCampaignList();

  if (!campaigns) return <main>Yükleniyor…</main>;

  return (
    <main>
      <h1>Stello</h1>
      {campaigns.length === 0 ? (
        <p>Henüz kampanya yok.</p>
      ) : (
        <ul>
          {campaigns.map((campaign) => (
            <li key={String(campaign.id)}>
              <a href={`/c/${campaign.id}`}>{campaign.title}</a> — %{campaign.percent} ·{" "}
              {campaign.pledgers} kişi
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
