"use client";

/**
 * Opens an internal route in a separate tab with safe defaults.
 * Intentionally does not fallback to same-tab navigation to avoid
 * duplicate navigation when browsers return null for security reasons.
 */
export function openInNewTab(url: string): void {
  if (typeof window === "undefined" || !url) return;

  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  newWindow?.focus();
}
