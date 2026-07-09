"use client";

import { useEmbedBridge } from "@/hooks";

export function EmbedBridgeMount() {
  useEmbedBridge();
  return null;
}
