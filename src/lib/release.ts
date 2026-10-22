export const RELEASED = {
  websiteOngoing: false,
  modelTabs: false,
  weeklyRates: false,
} as const;

export type ReleaseKey = keyof typeof RELEASED;

export const released = (key: ReleaseKey): boolean => RELEASED[key];
