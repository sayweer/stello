"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import Landing from "@/components/Landing.tsx";
import AppShell from "@/components/shell/AppShell.tsx";

type View = "landing" | "campaigns" | "new";

function viewFromHash(hash: string): View {
  const value = hash.replace("#", "");
  return value === "campaigns" || value === "new" ? value : "landing";
}

/**
 * One page, two worlds: the landing scene and the app shell behind it.
 *
 * Hash routing keeps the whole thing client-side, which is what lets the
 * curtain play uninterrupted — a navigation would tear the scene down halfway
 * through it.
 */
export default function Page() {
  const [view, setView] = useState<View>("landing");

  useEffect(() => {
    setView(viewFromHash(window.location.hash));
    const onHash = () => setView(viewFromHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((next: View) => {
    window.location.hash = next === "landing" ? "" : next;
    setView(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <AnimatePresence mode="wait">
      {view === "landing" ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <Landing onJoin={() => go("campaigns")} onCreate={() => go("new")} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AppShell view={view} onGo={go} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
