"use client";

import { useState } from "react";

/**
 * The install command, in whichever package manager the reader uses.
 *
 * Deliberately honest about the current state: the package is not on the
 * registry yet, so the archive line is the one that actually works today and
 * the registry line is shown as what it becomes. Printing only the registry
 * command would send people to an error.
 */
const MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
type Manager = (typeof MANAGERS)[number];

const ADD: Record<Manager, string> = {
  pnpm: "pnpm add",
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
};

export default function InstallBlock({ published = false }: { published?: boolean }) {
  const [manager, setManager] = useState<Manager>("pnpm");
  const [copied, setCopied] = useState(false);

  const command = published
    ? `${ADD[manager]} stello-sdk @stellar/stellar-sdk`
    : `${ADD[manager]} ./vendor/stello-sdk-0.1.0.tgz @stellar/stellar-sdk`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="install">
      <div className="install-tabs" role="tablist" aria-label="Paket yöneticisi">
        {MANAGERS.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={manager === name}
            className={manager === name ? "is-on" : undefined}
            onClick={() => setManager(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="install-line">
        <code>
          <span className="install-prompt">$</span> {command}
        </code>
        <button type="button" onClick={copy} aria-label="Kurulum komutunu kopyala">
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      {!published && (
        <p className="install-note">
          Paket henüz npm’de değil. Stello deposunda <code>pnpm sdk:pack</code> çalıştır, çıkan
          arşivi uygulamanın <code>vendor/</code> klasörüne koy. Yayından sonra:{" "}
          <code>{ADD[manager]} stello-sdk</code>
        </p>
      )}
    </div>
  );
}
