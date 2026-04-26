"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchHomepageCategoryCatalog } from "@/lib/api/properties";
import type { HomepageCategory } from "@/lib/api/types";
import { toCatalogFallback } from "@/lib/homepage/categories";

export function useHomepageCategories(enabled: boolean) {
  const [categories, setCategories] = useState<HomepageCategory[]>(
    toCatalogFallback().categories,
  );
  const [isLoading, setIsLoading] = useState(enabled);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const catalog = await fetchHomepageCategoryCatalog();
        if (!mounted) return;
        setCategories(
          catalog.categories.length > 0
            ? catalog.categories
            : toCatalogFallback().categories,
        );
      } catch (error) {
        if (!mounted) return;
        setHasError(true);
        setCategories(toCatalogFallback().categories);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [enabled]);

  return useMemo(
    () => ({ categories, isLoading, hasError }),
    [categories, isLoading, hasError],
  );
}
