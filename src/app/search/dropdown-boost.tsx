'use client';

import { useEffect } from 'react';

const NAMESPACE = 'fleethq:embed';

/**
 * The SearchBar's date-time picker renders its calendar overlay with
 * ``position: fixed`` inside the iframe. Fixed elements aren't part of
 * document flow, so bumping ``body.minHeight`` doesn't actually change
 * the body's rendered height, and the standard ResizeObserver bridge
 * never sees a change worth posting. The iframe stays at its closed-
 * state height and clips the calendar.
 *
 * Bypass the flow-based bridge entirely: watch the DOM for open
 * overlays and post a ``resize`` message straight to the widget parent
 * with the required height. The <fleethq-page-embed> host reads that
 * message and grows the iframe until the calendar fits.
 *
 * Mounted only from the embed /search route, so tenants using the
 * SearchBar at their own domain (kaysgroove et al.) are untouched.
 */
export function SearchEmbedDropdownBoost() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.parent === window) return;

    let raf = 0;
    let lastPosted = 0;

    const compute = () => {
      raf = 0;
      const openOverlays = document.querySelectorAll<HTMLElement>(
        '[role="dialog"], [role="listbox"], [role="menu"]',
      );
      let maxBottom = document.body.scrollHeight;
      openOverlays.forEach((el) => {
        if (el.offsetParent === null) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const absoluteBottom = rect.bottom + window.scrollY;
        if (absoluteBottom > maxBottom) maxBottom = absoluteBottom;
      });
      const needed = Math.ceil(maxBottom + 24);
      if (Math.abs(needed - lastPosted) < 8) return;
      lastPosted = needed;
      window.parent.postMessage(
        { namespace: NAMESPACE, payload: { type: 'resize', height: needed } },
        '*',
      );
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(compute);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    schedule();

    return () => {
      observer.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, []);

  return null;
}
