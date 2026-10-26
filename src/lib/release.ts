export const RELEASED = {
  websiteOngoing: true,
  modelTabs: true,
  weeklyRates: true,
} as const;

export type ReleaseKey = keyof typeof RELEASED;

export const released = (key: ReleaseKey): boolean => RELEASED[key];
