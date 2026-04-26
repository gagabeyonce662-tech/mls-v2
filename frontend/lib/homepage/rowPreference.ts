"use client";

export const HOMEPAGE_ROW_COUNT_PREF_KEY = "homepage_row_count_preference";
export const HOMEPAGE_ROW_COUNT_EVENT = "homepage-row-count-change";

export function parseHomepageRowCountPreference(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}
