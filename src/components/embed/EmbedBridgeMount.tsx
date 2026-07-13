"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useEmbedBridge } from "@/hooks";
import { isEmbedded, notifyResize } from "@/lib/embed-bridge";

const EMBED_CLASS = "fleethq-embedded";

export function EmbedBridgeMount() {
  useEmbedBridge();
  const pathname = usePathname();

  useEffect(() => {
    if (!isEmbedded()) return;
    document.body.classList.add(EMBED_CLASS);
    return () => {
      document.body.classList.remove(EMBED_CLASS);
    };
  }, []);

  useEffect(() => {
    if (!isEmbedded()) return;
    const timers = [40, 160, 360, 720].map((delay) =>
      window.setTimeout(() => {
        const h = Math.ceil(document.body.getBoundingClientRect().height);
        if (h > 0) notifyResize(h + 8);
      }, delay),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname]);

  return null;
}
