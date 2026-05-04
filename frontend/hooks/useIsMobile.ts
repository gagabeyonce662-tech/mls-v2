"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe match-media hook for mobile breakpoint.
 * Aligns with Tailwind `md` (768px): treats viewport widths < 768px as mobile.
 * Returns `false` until mounted so initial server render is stable.
 */
export function useIsMobile(query: string = "(max-width: 767px)"): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    // Safari < 14 fallback
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [query]);

  return isMobile;
}

export default useIsMobile;
