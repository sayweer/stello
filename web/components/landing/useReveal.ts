"use client";

import { useEffect } from "react";

/**
 * Motion for the landing page.
 *
 * The opening is an *uncovering*, not an entrance: two paper panels meet at the
 * wordmark's seam and part, and the hero is already standing behind them. The
 * headline is deliberately not animated in — animating both reads as the page
 * being built twice.
 *
 *   1. the name assembles at the seam, letter by letter
 *   2. a sliver opens between the panels
 *   3. the gap widens past the viewport, carrying both halves of the name off
 *      screen; the accent fills the opening
 *   4. the fill lifts away and hands the screen to the hero
 *   5. nav links and supporting blocks rise out of their boxes on expo.out
 *
 * GSAP and Lenis are imported dynamically so they never reach the app bundle.
 * `.lp--pending` is what hides elements before the timeline exists; anything
 * that decides not to animate must remove it or the page stays blank.
 */
export function useReveal(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.querySelector<HTMLElement>(".lp");
    const reveal = () => root?.classList.remove("lp--pending");
    const settle = () => root?.classList.add("lp--motion-done");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      settle();
      return;
    }

    let disposed = false;
    let dispose = () => {};

    void (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }, { SplitText }, lenisModule] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("gsap/SplitText"),
          import("lenis"),
        ]);

        // Under StrictMode the first effect is torn down before its imports
        // land. Reveal so the page is never left hidden, but do not settle —
        // that would unclip the rise boxes while the second run still has its
        // blocks parked below their masks.
        if (disposed) {
          reveal();
          return;
        }

        gsap.registerPlugin(ScrollTrigger, SplitText);

        // Lenis drives the scroll and must be driven from GSAP's ticker, not
        // its own rAF: with two loops, Lenis writes a scroll position in one
        // callback while GSAP renders scrubbed tweens in another, and the two
        // end up a frame apart — felt as shudder even with no dropped frame.
        const Lenis = lenisModule.default;
        // `anchors` matters for more than smoothness: a native hash jump moves
        // the page without Lenis knowing, and ScrollTrigger reads its position
        // from Lenis — so section headings would stay hidden after following a
        // nav link.
        const lenis = new Lenis({ duration: 1.1, smoothWheel: true, anchors: true });
        const onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);

        const drive = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(drive);
        gsap.ticker.lagSmoothing(0);

        // Line wrappers built for the heading wipe have to be unwound by hand:
        // ctx.revert() knows about tweens, not about DOM this effect inserted.
        const splits: { revert: () => void }[] = [];

        const context = gsap.context(() => {
          const loadChars = gsap.utils.toArray<HTMLElement>(".lp__hero .lp__load-char");
          const chars = gsap.utils.toArray<HTMLElement>(".lp__hero h1 .lp__char");
          const markChars = gsap.utils.toArray<HTMLElement>(".lp__hero h1 .lp__mark .lp__char");
          const leadChars = chars.filter((char) => !markChars.includes(char));
          const navLinks = gsap.utils.toArray<HTMLElement>(".lp__hero .lp__nav-link");
          const rises = gsap.utils.toArray<HTMLElement>(".lp__hero .lp__rise");

          // Put the seam where the name actually splits: the two halves are not
          // the same width, so a 50/50 curtain would hang the word off-axis.
          const curtain = document.querySelector<HTMLElement>(".lp__curtain");
          const half1 = document.querySelector<HTMLElement>(".lp__brand-start");
          const half2 = document.querySelector<HTMLElement>(".lp__brand-end");
          let curtainGap = Math.ceil(window.innerWidth * 1.1);

          if (curtain && half1 && half2) {
            const width1 = half1.getBoundingClientRect().width;
            const width2 = half2.getBoundingClientRect().width;
            // The curtain is inset inside the hero, so its width excludes the
            // scrollbar while window.innerWidth includes it.
            const stage = curtain.getBoundingClientRect().width;
            const seam = (stage - (width1 + width2)) / 2 + width1;
            curtain.style.setProperty("--seam", `${seam}px`);

            // Each panel's width is its side of the seam minus half the gap, so
            // the gap must be twice the wider side to clear both.
            curtainGap = Math.ceil(2 * Math.max(seam, stage - seam) + 48);
          }

          const timeline = gsap.timeline({
            defaults: { ease: "expo.inOut" },
            onComplete: settle,
          });

          // 1 — the name assembles at the seam.
          if (loadChars.length) {
            timeline.from(loadChars, { yPercent: 100, stagger: 0.025, duration: 1.25 }, 0);
          }

          // 2 — a sliver opens: enough to show there is something behind.
          timeline.fromTo(
            ".lp__curtain",
            { "--gap": "0px" },
            { "--gap": "120px", duration: 1.25 },
            ">",
          );

          // 3 — then all the way past the viewport, carrying the name with it.
          timeline.to(".lp__curtain", { "--gap": `${curtainGap}px`, duration: 2 }, "<1.25");

          // 3b — the fill lifts away and hands the screen to the hero.
          timeline.to(
            ".lp__curtain-fill",
            { yPercent: -100, duration: 1.15, ease: "expo.inOut" },
            "<1.35",
          );

          // 4 — the headline is NOT animated: the curtain reveals it in place.

          // 5 — the nav follows the curtain on a slower stagger.
          if (navLinks.length) {
            timeline.from(
              navLinks,
              { yPercent: 110, duration: 1.25, ease: "expo.out", stagger: 0.1 },
              "<",
            );
          }

          // The heading's two halves separate as they land, mirroring step 3.
          if (leadChars.length) {
            timeline.fromTo(leadChars, { x: "0em" }, { x: "-0.05em", duration: 1.25 }, "<");
          }
          if (markChars.length) {
            timeline.fromTo(markChars, { x: "0em" }, { x: "0.05em", duration: 1.25 }, "<");
          }

          // The highlight wipes in while the phrase is already standing.
          timeline.from(
            ".lp__hero .lp__mark-fill",
            { scaleX: 0, duration: 0.9, ease: "power3.inOut" },
            "<0.55",
          );

          timeline.from(".lp__hero .lp__rule", { width: 0, duration: 0.9 }, "<0.1");
          timeline.from(".lp__hero .lp__counter-rule", { scaleX: 0, duration: 1.1 }, "<0.15");

          if (rises.length) {
            timeline.from(
              rises,
              { yPercent: 110, duration: 1.25, ease: "expo.out", stagger: 0.1 },
              "<0.1",
            );
          }

          // ---- section headings: a panel wipes across each line ------------
          gsap.utils.toArray<HTMLElement>(".lp__reveal-head").forEach((element) => {
            const split = SplitText.create(element, {
              type: "lines",
              linesClass: "lp__line",
              lineThreshold: 0.1,
            });
            splits.push(split);

            const blocks: HTMLElement[] = [];
            split.lines.forEach((line) => {
              const wrap = document.createElement("span");
              wrap.className = "lp__line-wrap";
              line.parentNode?.insertBefore(wrap, line);
              wrap.appendChild(line);

              const block = document.createElement("i");
              block.className = "lp__revealer";
              wrap.appendChild(block);
              blocks.push(block);
            });

            gsap.set(split.lines, { opacity: 0 });
            gsap.set(blocks, { scaleX: 0, transformOrigin: "left center" });

            split.lines.forEach((line, index) => {
              const block = blocks[index];
              if (!block) return;

              const lineTimeline = gsap.timeline({ paused: true, delay: index * 0.15 });
              lineTimeline
                .to(block, { scaleX: 1, duration: 0.5, ease: "power2.inOut" })
                .set(line, { opacity: 1 })
                .to(block, {
                  scaleX: 0,
                  transformOrigin: "right center",
                  duration: 0.5,
                  ease: "power2.inOut",
                });

              ScrollTrigger.create({
                trigger: element,
                start: "top 82%",
                once: true,
                onEnter: () => lineTimeline.play(),
              });
            });
          });

          // ---- cards and steps open from their own edge --------------------
          gsap.utils.toArray<HTMLElement>(".lp__reveal-up").forEach((element) => {
            gsap.from(element, {
              y: 28,
              opacity: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: element, start: "top 88%", once: true },
            });
          });

          gsap.utils.toArray<HTMLElement>(".lp__reveal-stagger").forEach((row) => {
            gsap.from(row.children, {
              y: 24,
              opacity: 0,
              duration: 0.7,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: { trigger: row, start: "top 86%", once: true },
            });
          });

          // The nav gets a background once the hero is behind you.
          ScrollTrigger.create({
            start: "top -80",
            onToggle: (self) => root?.classList.toggle("lp--nav-solid", self.isActive),
          });
        }, root ?? undefined);

        reveal();
        ScrollTrigger.refresh();

        dispose = () => {
          context.revert();
          splits.forEach((split) => split.revert());
          gsap.ticker.remove(drive);
          lenis.off("scroll", onScroll);
          lenis.destroy();
        };
      } catch {
        // Motion is an enhancement: if GSAP fails to load, show the page.
        reveal();
        settle();
      }
    })();

    return () => {
      disposed = true;
      dispose();
    };
  }, []);
}
