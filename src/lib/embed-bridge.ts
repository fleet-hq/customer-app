"use client";

const NAMESPACE = "fleethq:embed";

type Outbound =
  | { type: "ready"; height?: number; url?: string }
  | { type: "resize"; height: number }
  | { type: "close" }
  | { type: "navigate"; url: string }
  | { type: "booking-complete"; bookingId: number; referenceNumber?: string; url?: string }
  | { type: "booking-error"; message: string; code?: string }
  | { type: "handoff"; url: string };

type Inbound =
  | { type: "hello"; version: string; tenant: string }
  | { type: "close" }
  | { type: "focus" }
  | { type: "resize-hint"; maxHeight: number };

export const EMBED_QUERY_PARAM = "embed";
export const EMBED_TENANT_PARAM = "embed_tenant";
export const EMBED_VERSION_PARAM = "embed_version";

export const isEmbedded = (): boolean => {
  if (typeof window === "undefined") return false;
  if (window.parent === window) return false;
  const params = new URLSearchParams(window.location.search);
  return params.get(EMBED_QUERY_PARAM) === "1";
};

const post = (payload: Outbound): void => {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage({ namespace: NAMESPACE, payload }, "*");
};

export const notifyReady = (extras: { height?: number; url?: string } = {}): void => {
  post({ type: "ready", ...extras });
};

export const notifyResize = (height: number): void => {
  post({ type: "resize", height });
};

export const notifyClose = (): void => post({ type: "close" });

export const notifyNavigate = (url: string): void => post({ type: "navigate", url });

export const notifyBookingComplete = (
  bookingId: number,
  extras: { referenceNumber?: string; url?: string } = {},
): void => post({ type: "booking-complete", bookingId, ...extras });

export const notifyBookingError = (message: string, code?: string): void => {
  post({ type: "booking-error", message, code });
};

export const requestHandoff = (url: string): void => post({ type: "handoff", url });

type InboundListener = (msg: Inbound, event: MessageEvent) => void;

export const listenForParentMessages = (listener: InboundListener): (() => void) => {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: MessageEvent): void => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.namespace !== NAMESPACE || !data.payload) return;
    listener(data.payload as Inbound, event);
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
};

let resizeObserver: ResizeObserver | null = null;
let resizeTarget: HTMLElement | null = null;

export const startAutoResize = (target: HTMLElement | null = document.body): (() => void) => {
  if (typeof window === "undefined") return () => undefined;
  if (!target) return () => undefined;
  stopAutoResize();
  resizeTarget = target;

  // Runaway-growth guard. The parent resizes the iframe to whatever height
  // we post, but a page whose body inherits 100vh (min-height, flex-grow,
  // sticky footers) grows to fill the new size, so the next measurement
  // reports a larger height and we loop up to the parent's max cap. Filter
  // noise: only post when the change is meaningful, debounce, and stop
  // when the same height is seen three times in a row.
  let lastPosted = 0;
  let repeatCount = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const MIN_DELTA = 12;
  const DEBOUNCE_MS = 120;

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const measured = Math.ceil(entry.contentRect.height);
      if (Math.abs(measured - lastPosted) < MIN_DELTA) {
        repeatCount += 1;
        if (repeatCount > 3) return;
      } else {
        repeatCount = 0;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        lastPosted = measured;
        notifyResize(measured + 8);
      }, DEBOUNCE_MS);
    }
  });
  resizeObserver.observe(target);
  return stopAutoResize;
};

export const stopAutoResize = (): void => {
  if (resizeObserver && resizeTarget) resizeObserver.unobserve(resizeTarget);
  resizeObserver?.disconnect();
  resizeObserver = null;
  resizeTarget = null;
};
