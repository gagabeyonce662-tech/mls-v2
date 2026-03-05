"use client";

import { useEffect, useState } from "react";
import { fetchPreConnProperties, Property } from "@/lib/api";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";

export function PreConstructionSection() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { openQuickView } = useQuickView();

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const response = await fetchPreConnProperties({});
            setProperties(response.results || []);
            setTotalCount(response.count || 0);
            setIsLoading(false);
        };
        load();
    }, []);

    return (
        <PropertyGridSection
            title="Pre-Construction Properties"
            subtitle={`Exclusive pre-construction investment opportunities (${totalCount || properties.length})`}
            viewAllHref="/Precon"
            properties={properties}
            totalCount={totalCount}
            isLoading={isLoading}
            onQuickView={openQuickView}
            emptyTitle="No pre-construction properties found"
            emptySubtitle="Check back soon for new developments."
        />
    );
}
