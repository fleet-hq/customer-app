"use client";

import { useEffect } from "react";

import {
  isEmbedded,
  listenForParentMessages,
  notifyBookingComplete,
  notifyBookingError,
  notifyClose,
  notifyNavigate,
  notifyReady,
  requestHandoff,
  startAutoResize,
  stopAutoResize,
} from "@/lib/embed-bridge";

interface UseEmbedBridgeOptions {
  onCloseRequest?: () => void;
  autoResizeTarget?: HTMLElement | null;
}

export interface EmbedBridgeApi {
  embedded: boolean;
  reportBookingComplete: (bookingId: number, extras?: { referenceNumber?: string; url?: string }) => void;
  reportBookingError: (message: string, code?: string) => void;
  reportNavigate: (url: string) => void;
  requestClose: () => void;
  handoff: (url: string) => void;
}

export const useEmbedBridge = (options: UseEmbedBridgeOptions = {}): EmbedBridgeApi => {
  const embedded = typeof window !== "undefined" && isEmbedded();

  useEffect(() => {
    if (!embedded) return;

    notifyReady({ url: window.location.href });
    const detachAutoResize = startAutoResize(options.autoResizeTarget ?? document.body);
    const detachListener = listenForParentMessages((msg) => {
      if (msg.type === "close" && options.onCloseRequest) options.onCloseRequest();
    });

    const onPop = (): void => notifyNavigate(window.location.href);
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      detachListener();
      detachAutoResize();
      stopAutoResize();
    };
  }, [embedded, options]);

  return {
    embedded,
    reportBookingComplete: notifyBookingComplete,
    reportBookingError: notifyBookingError,
    reportNavigate: notifyNavigate,
    requestClose: notifyClose,
    handoff: requestHandoff,
  };
};
