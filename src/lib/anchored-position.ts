import type { CSSProperties } from 'react';

export interface AnchoredPanelOptions {
  panelWidth: number;
  panelHeight: number;
  gap?: number;
  margin?: number;
}

export interface AnchoredPanelPosition {
  style: CSSProperties;
  origin: 'origin-top' | 'origin-bottom';
}

function bodyZoom(): number {
  if (typeof document === 'undefined') return 1;
  const z = parseFloat(getComputedStyle(document.body).zoom || '1');
  return Number.isFinite(z) && z > 0 ? z : 1;
}

export function computeAnchoredPanelPosition(
  trigger: HTMLElement,
  { panelWidth, panelHeight, gap = 8, margin = 8 }: AnchoredPanelOptions,
): AnchoredPanelPosition {
  const zoom = bodyZoom();
  const rect = trigger.getBoundingClientRect();
  const top = rect.top / zoom;
  const bottom = rect.bottom / zoom;
  const left = rect.left / zoom;
  const viewportHeight = window.innerHeight / zoom;
  const viewportWidth = window.innerWidth / zoom;

  const clampedLeft = Math.max(margin, Math.min(left, viewportWidth - panelWidth - margin));
  const openUp = viewportHeight - bottom < panelHeight && top > panelHeight;

  if (openUp) {
    return {
      style: { position: 'fixed', bottom: viewportHeight - top + gap, left: clampedLeft },
      origin: 'origin-bottom',
    };
  }
  return {
    style: { position: 'fixed', top: bottom + gap, left: clampedLeft },
    origin: 'origin-top',
  };
}
