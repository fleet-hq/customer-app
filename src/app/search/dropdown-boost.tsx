'use client';

import { useEffect } from 'react';

/**
 * Inside a widget iframe, the SearchBar's date-time picker and
 * location listboxes render as absolutely-positioned overlays. Their
 * height is not part of ``document.body``'s natural flow, so
 * ``ResizeObserver`` on body never reports a taller size when they open
 * — the parent iframe stays capped at the small closed-state height and
 * clips the dropdown.
 *
 * This component runs a MutationObserver on the body and, whenever any
 * open floating panel (``[role="listbox"]`` / ``[role="dialog"]`` /
 * ``.absolute``) becomes visible, sets ``body.style.minHeight`` to
 * cover its bottom edge. That change bubbles through the resize bridge
 * → parent grows the iframe → dropdown is fully visible.
 *
 * Rendered only on the embed ``/search`` route, so kaysgroove and other
 * tenants using SearchBar at their own domain are untouched.
 */
export function SearchEmbedDropdownBoost() {
  useEffect(() => {
    const CLOSED_MIN = 220;
    let raf = 0;

    const compute = () => {
      raf = 0;
      const candidates = document.querySelectorAll<HTMLElement>(
        '[role="listbox"], [role="dialog"], [role="menu"], .absolute',
      );
      let maxBottom = 0;
      candidates.forEach((el) => {
        if (el.offsetParent === null) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const bottom = rect.bottom + window.scrollY;
        if (bottom > maxBottom) maxBottom = bottom;
      });
      const needed = Math.max(CLOSED_MIN, Math.ceil(maxBottom + 32));
      document.body.style.minHeight = `${needed}px`;
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
      document.body.style.minHeight = '';
    };
  }, []);

  return null;
}
