'use client';

import { useEffect } from 'react';

const NAMESPACE = 'fleethq:embed';

const OVERLAY_SELECTORS = [
  '[role="dialog"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="grid"]',
  '[data-radix-popper-content-wrapper]',
  '[data-radix-portal]',
  '[data-headlessui-portal]',
  '[data-slot="popover-content"]',
  '[data-slot="calendar"]',
  '[data-state="open"]',
  '.rdp',
  '[class*="Calendar" i]',
  '[class*="Popover" i]',
  '[class*="Picker" i]',
  '[class*="Dropdown" i]',
].join(', ');

export function SearchEmbedDropdownBoost() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.parent === window) return;

    let raf = 0;
    let lastPosted = 0;

    const scanElement = (el: HTMLElement, maxBottom: number): number => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return maxBottom;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return maxBottom;
      const bottom = rect.bottom + window.scrollY;
      return bottom > maxBottom ? bottom : maxBottom;
    };

    const compute = () => {
      raf = 0;
      let maxBottom = document.body.scrollHeight;

      document.querySelectorAll<HTMLElement>(OVERLAY_SELECTORS).forEach((el) => {
        maxBottom = scanElement(el, maxBottom);
      });

      Array.from(document.body.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        const cs = window.getComputedStyle(child);
        if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
        maxBottom = scanElement(child, maxBottom);
        child.querySelectorAll<HTMLElement>('*').forEach((desc) => {
          maxBottom = scanElement(desc, maxBottom);
        });
      });

      const needed = Math.ceil(maxBottom + 48);
      if (Math.abs(needed - lastPosted) < 8) return;
      lastPosted = needed;
      window.parent.postMessage(
        { namespace: NAMESPACE, payload: { type: 'resize', height: needed } },
        '*',
      );
    };

    const pendingTimers: number[] = [];
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
      pendingTimers.push(window.setTimeout(compute, 60));
      pendingTimers.push(window.setTimeout(compute, 160));
      pendingTimers.push(window.setTimeout(compute, 320));
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    document.addEventListener('focusin', schedule, true);
    document.addEventListener('pointerdown', schedule, true);
    document.addEventListener('pointerup', schedule, true);
    document.addEventListener('click', schedule, true);
    document.addEventListener('keyup', schedule, true);
    schedule();

    return () => {
      observer.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
      pendingTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      document.removeEventListener('focusin', schedule, true);
      document.removeEventListener('pointerdown', schedule, true);
      document.removeEventListener('pointerup', schedule, true);
      document.removeEventListener('click', schedule, true);
      document.removeEventListener('keyup', schedule, true);
    };
  }, []);

  return null;
}
