"use client";

import { useState } from "react";
import { inline } from "./Prose";
import type { Copy } from "@/lib/copy";

/**
 * The install command, in whichever package manager the reader uses.
 */
const MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
type Manager = (typeof MANAGERS)[number];

const ADD: Record<Manager, string> = {
  pnpm: "pnpm add",
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
};

export default function InstallBlock({ t }: { t: Copy["install"] }) {
  const [manager, setManager] = useState<Manager>("pnpm");
  const [copied, setCopied] = useState(false);

  const command = `${ADD[manager]} stello-sdk @stellar/stellar-sdk`;

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
      <div className="install-tabs" role="tablist" aria-label={t.managers}>
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
        <button type="button" onClick={copy} aria-label={t.copyAria}>
          {copied ? t.copied : t.copy}
        </button>
      </div>
      <p className="install-note">{inline(t.note)}</p>
    </div>
  );
}
