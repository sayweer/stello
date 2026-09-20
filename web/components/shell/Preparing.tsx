"use client";

import type { StepName } from "@stello/core";

/**
 * Onboarding, stated out loud.
 *
 * A participant never asked for a Stellar account, a trustline or an anchor
 * session — but all three have to exist before their bank transfer can land.
 * Naming the steps costs nothing and is the honest version of a spinner.
 */
const STEPS: { key: StepName; label: string }[] = [
  { key: "account", label: "Hesabın açılıyor" },
  { key: "trustline", label: "Para alabilmen için izin veriliyor" },
  { key: "signin", label: "Kuruma giriş yapılıyor" },
  { key: "customer", label: "Kimliğin kaydediliyor" },
];

export default function Preparing({
  step,
  error,
  onRetry,
  onClose,
}: {
  step: StepName | null;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const current = STEPS.findIndex((entry) => entry.key === step);

  return (
    <div className="prep" role="dialog" aria-modal="true" aria-label="Hazırlanıyor">
      <div className="prep__box">
        <h2 className="prep__title">Hazırlanıyor</h2>
        <p className="prep__lede">
          Katılman için gereken hesap bu telefonda açılıyor. Bir kez yapılıyor, sonra hatırlanıyor.
        </p>

        <div className="prep__steps">
          {STEPS.map((entry, index) => {
            const done = current > index || (current === -1 && step === null && !error);
            const active = current === index;
            return (
              <div
                key={entry.key}
                className={`prep__step${active ? " is-active" : ""}${done ? " is-done" : ""}`}
              >
                <span className="prep__mark">{done ? "✓" : index + 1}</span>
                {entry.label}
              </div>
            );
          })}
        </div>

        {error ? (
          <>
            <div className="prep__error">{error}</div>
            <div className="lp__actions" style={{ marginTop: 14 }}>
              <button className="lp__cta" onClick={onRetry} type="button">
                Yeniden dene
              </button>
              <button className="lp__cta lp__cta--ghost" onClick={onClose} type="button">
                Vazgeç
              </button>
            </div>
          </>
        ) : (
          <p className="prep__note">
            Anahtarın bu tarayıcıda saklanıyor. Tarayıcı verisini silersen erişimini kaybedersin —
            test ağında olduğumuz için sorun değil.
          </p>
        )}
      </div>
    </div>
  );
}
