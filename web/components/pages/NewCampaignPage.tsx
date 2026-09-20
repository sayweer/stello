"use client";

// The organizer's side: name the thing, set the goal and the deadline, and lock the bonus that
// makes the promise worth believing.
import { createCampaign, ensureReady, fundBonus, toStroops, type StepName } from "@stello/core";
import { motion } from "framer-motion";
import { useState } from "react";

import { useFlow, useWallet } from "@/lib/hooks.ts";
import { triggerRelay } from "@/lib/wallet.ts";

const EASE = [0.2, 0.7, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

const STEP_LABEL: Partial<Record<StepName, string>> = {
  account: "Hesabın açılıyor",
  trustline: "Para alabilmen için izin veriliyor",
  signin: "Ödeme kuruluşuna giriş yapılıyor",
  customer: "Kimliğin kaydediliyor",
  ticket: "Bonus için açıklama kodu alınıyor",
  deposit: "IBAN hazırlanıyor",
  "waiting-transfer": "Bonus havalesi bekleniyor",
  "waiting-chain": "Bonus kontrata kilitleniyor",
};

const DURATIONS = [
  { label: "5 dk", seconds: 300 },
  { label: "1 saat", seconds: 3600 },
  { label: "1 gün", seconds: 86_400 },
  { label: "1 hafta", seconds: 604_800 },
];

export default function NewCampaignPage({ onCreated }: { onCreated: (id: bigint) => void }) {
  const { ensureKeypair } = useWallet();
  const flow = useFlow<bigint>();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("100");
  const [bonus, setBonus] = useState("10");
  const [cap, setCap] = useState("4");
  const [duration, setDuration] = useState(DURATIONS[0]!.seconds);

  const valid = title.trim().length > 0 && Number(goal) > 0 && Number(cap) > 0 && Number(bonus) >= 0;

  const submit = () =>
    flow
      .run(async (onStep) => {
        const keypair = ensureKeypair();
        await ensureReady(keypair, onStep);

        const id = await createCampaign(keypair, {
          title: title.trim().slice(0, 64),
          goal: toStroops(goal),
          deadline: BigInt(Math.floor(Date.now() / 1000) + duration),
          bonus: toStroops(bonus),
          cap: toStroops(cap),
        });

        // The campaign only opens once the bonus is actually in the contract.
        if (Number(bonus) > 0) {
          await fundBonus({ keypair, campaignId: id, onStep, triggerRelay });
        }
        return id;
      })
      .then((id) => id !== null && onCreated(id));

  return (
    <div className="page">
      <div className="page__main">
        <motion.section className="verdict verdict--quiet" {...fadeUp(0)}>
          <div>
            <div className="eyebrow">Organizatör</div>
            <div className="verdict__line">
              <span className="verdict__amount">Kampanya aç</span>
            </div>
            <div className="verdict__why">
              Hedefi ve süreyi sen koyarsın. Bonusu baştan kilitlersin; hedef tutmazsa katılanlara
              dağılır, tutarsa sana geri döner.
            </div>
          </div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.08)}>
          <div style={{ display: "grid", gap: 16 }}>
            <label className="lab">
              <span>Ne için toplanıyor?</span>
              <input
                className="field"
                value={title}
                maxLength={64}
                placeholder="Gece pizzası"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="two">
              <label className="lab">
                <span>Hedef (USDC)</span>
                <input className="field" inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} />
              </label>
              <label className="lab">
                <span>Kilitleyeceğin bonus (USDC)</span>
                <input className="field" inputMode="decimal" value={bonus} onChange={(e) => setBonus(e.target.value)} />
              </label>
            </div>

            <div className="two">
              <label className="lab">
                <span>Kişi başı bonus tavanı (USDC)</span>
                <input className="field" inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} />
              </label>
              <div className="lab">
                <span>Süre</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DURATIONS.map((d) => (
                    <button
                      key={d.seconds}
                      className={`chip${duration === d.seconds ? " is-on" : ""}`}
                      onClick={() => setDuration(d.seconds)}
                      type="button"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <button
                className="btn btn--lg"
                onClick={() => void submit()}
                disabled={!valid || flow.busy}
                type="button"
              >
                {flow.busy ? "Açılıyor…" : "Kampanyayı aç ve bonusu kilitle"}
              </button>
            </div>

            {flow.step && (
              <div className="steps">
                <div className="step">
                  <span className="step__n">…</span>
                  <span>
                    {STEP_LABEL[flow.step.name] ?? flow.step.name}
                    {flow.step.detail ? ` (${flow.step.detail})` : ""}
                  </span>
                </div>
              </div>
            )}
            {flow.error && <div className="err">{flow.error}</div>}
          </div>
        </motion.section>
      </div>

      <div className="page__side">
        <motion.section className="panel panel--pad" {...fadeUp(0.06)}>
          <div className="eyebrow">Bonus neden var</div>
          <div className="panel__note" style={{ marginTop: 10 }}>
            "Yeterli kişi olursa" işlerinde herkes başkasının önce davranmasını bekler. Bonus,
            erken katılana "tutmazsa kazanırsın" der — beklemeyi anlamsız kılar.
          </div>
        </motion.section>

        <motion.section className="panel panel--pad" {...fadeUp(0.1)}>
          <div className="eyebrow">Tavan neden var</div>
          <div className="panel__note" style={{ marginTop: 10 }}>
            Bonus payı kişi başı bu tutara kadar sayılır. Son dakikada büyük para koyup bonusu
            toplamak işe yaramaz.
          </div>
        </motion.section>
      </div>
    </div>
  );
}
