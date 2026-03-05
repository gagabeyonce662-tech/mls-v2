"use client";

import { useEffect, useState } from "react";
import { fetchLeaseProperties, Property } from "@/lib/api";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";

export function RentalPropertiesSection() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { openQuickView } = useQuickView();

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const response = await fetchLeaseProperties({});
            setProperties(response.results || []);
            setTotalCount(response.count || 0);
            setIsLoading(false);
        };
        load();
    }, []);

    return (
        <PropertyGridSection
            title="Rental Properties"
            subtitle={`Find your perfect rental property (${totalCount || properties.length} available)`}
            viewAllHref="/listing/rental"
            viewAllLabel="View All Rentals"
            properties={properties}
            totalCount={totalCount}
            isLoading={isLoading}
            onQuickView={openQuickView}
            emptyTitle="No rental properties found"
            emptySubtitle="Check back soon for new rental listings."
        />
    );
}
