"use client";

import { config } from "@stello/core";

import { useCampaignList } from "@/lib/hooks.ts";
import Hero from "./landing/Hero.tsx";
import { Bonus, FinalCta, Footer, HowItWorks, MoneyTrail } from "./landing/Sections.tsx";
import { useReveal } from "./landing/useReveal.ts";

export default function Landing({
  onJoin,
  onCreate,
}: {
  onJoin: () => void;
  onCreate: () => void;
}) {
  useReveal();
  const campaigns = useCampaignList();

  return (
    // `lp--pending` hides the reveal targets from the first paint; useReveal
    // either animates them in or removes the class outright.
    <div className="lp lp--pending">
      <Hero campaigns={campaigns} onJoin={onJoin} onCreate={onCreate} />
      <HowItWorks />
      <MoneyTrail />
      <Bonus />
      <FinalCta onJoin={onJoin} />
      <Footer routerId={config.routerId} campaignId={config.campaignId} />
    </div>
  );
}
