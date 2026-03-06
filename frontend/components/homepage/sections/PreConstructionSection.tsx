"use client";

import { useEffect, useState } from "react";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";
import { fetchAllWPPreconPropertiesAction } from "@/lib/actions/wp-precon";
import { Property } from "@/lib/api/types";

export function PreConstructionSection() {
  const { openQuickView } = useQuickView();
  const [requestedCount, setRequestedCount] = useState(4); // Default desktop count
  const [preConProperties, setPreConProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Breakpoint Sensor
  useEffect(() => {
    const calculateRequired = () => {
      if (typeof window === "undefined") return 4;
      const width = window.innerWidth;

      if (width >= 2400) return 12; // 4xl
      if (width >= 2000) return 8; // 3xl
      if (width >= 1600) return 6; // 2xl
      if (width >= 1024) return 4; // lg/xl
      if (width >= 768) return 3; // md
      if (width >= 640) return 2; // sm
      return 1; // mobile
    };

    setRequestedCount(calculateRequired());

    const handleResize = () => setRequestedCount(calculateRequired());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchPrecons = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllWPPreconPropertiesAction();
        if (mounted) setPreConProperties(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchPrecons();
    return () => {
      mounted = false;
    };
  }, []);

  const displayedProperties = preConProperties.slice(0, requestedCount);

  return (
    <PropertyGridSection
      title="Pre-Construction Properties"
      subtitle={`Exclusive pre-construction investment opportunities (${preConProperties.length})`}
      viewAllHref="/pre-construction"
      properties={displayedProperties as any}
      totalCount={preConProperties.length}
      isLoading={isLoading}
      onQuickView={openQuickView}
      emptyTitle="No pre-construction properties found"
      emptySubtitle="Check back soon for new developments."
      oneRowOnly={true}
      limit={requestedCount}
    />
  );
}
