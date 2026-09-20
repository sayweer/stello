"use client";

import { useEffect, useState } from "react";

/**
 * The opening: two panels meet at the wordmark's seam and part, uncovering a
 * page that was already standing behind them. Nothing is faked and nothing
 * hands over to anything — what widens into view is the page itself.
 *
 * Pure CSS animation. A docs site should not ship an animation library for one
 * five-second scene, and the timeline never needs to be scrubbed or reversed.
 * JavaScript only measures the seam ("Ste" and "llo" are not the same width, so
 * an even split would push the word off the page's axis) and stays out after.
 *
 * It plays once per session: a developer moving between the docs and the home
 * page should not sit through it again.
 */
const SEEN_KEY = "stello:curtain";

/**
 * Decided once per page load and kept out of the component: React runs effects
 * twice in development, and a decision that reads the same flag it writes would
 * skip its own animation on the second pass.
 */
let decision: "play" | "skip" | null = null;

function decide(): "play" | "skip" {
  if (decision) return decision;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Private mode: treat it as a first visit and let it play.
  }

  decision = reduced || seen ? "skip" : "play";
  return decision;
}

export default function Curtain() {
  const [state, setState] = useState<"unknown" | "play" | "skip">("unknown");

  useEffect(() => {
    setState(decide());
  }, []);

  useEffect(() => {
    if (state !== "play") return;

    // Put the seam where the name actually splits, then let CSS drive.
    const measure = () => {
      const root = document.querySelector<HTMLElement>(".curtain");
      const left = document.querySelector<HTMLElement>(".curtain-word--l");
      const right = document.querySelector<HTMLElement>(".curtain-word--r");
      if (!root || !left || !right) return;

      const stage = root.getBoundingClientRect().width;
      const seam = (stage - (left.offsetWidth + right.offsetWidth)) / 2 + left.offsetWidth;
      root.style.setProperty("--seam", `${seam}px`);
      // Both panels have to clear the stage, and the seam is off-centre, so the
      // gap must open to twice the wider side.
      root.style.setProperty("--gap-open", `${Math.ceil(2 * Math.max(seam, stage - seam) + 48)}px`);
    };

    measure();
    // The webfont lands after first paint and changes the letter widths.
    void document.fonts?.ready.then(measure).catch(() => {});

    // Remembered only once it has actually played, so an interrupted load does
    // not rob the next one of the scene.
    const done = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Not remembering is better than not playing.
      }
      setState("skip");
    }, 3200);
    return () => window.clearTimeout(done);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("is-opening", state === "play");
    return () => document.documentElement.classList.remove("is-opening");
  }, [state]);

  if (state !== "play") return null;

  return (
    <div className="curtain" aria-hidden="true">
      <i className="curtain-fill" />
      <div className="curtain-half curtain-half--l">
        <span className="curtain-word curtain-word--l">
          {[..."Ste"].map((char, index) => (
            <span key={index} style={{ animationDelay: `${index * 0.045}s` }}>
              {char}
            </span>
          ))}
        </span>
      </div>
      <div className="curtain-half curtain-half--r">
        <span className="curtain-word curtain-word--r">
          {[..."llo"].map((char, index) => (
            <span key={index} style={{ animationDelay: `${(index + 3) * 0.045}s` }}>
              {char}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
