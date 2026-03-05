"use client";

import { useEffect, useState, useRef } from "react";
import { fetchExclusiveProperties, Property } from "@/lib/api";
import { useProvince } from "@/contexts/ProvinceContext";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";

export function ExclusivePropertiesSection() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { selectedProvince, getProvinceName } = useProvince();
    const { openQuickView } = useQuickView();
    const prevProvinceRef = useRef<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);

            const provinceName = getProvinceName(selectedProvince);
            const provinceMapping: any = {
                Ontario: "ON",
                Quebec: "QC",
                "British Columbia": "BC",
                Alberta: "AB",
                Manitoba: "MB",
                Saskatchewan: "SK",
                "Nova Scotia": "NS",
                "New Brunswick": "NB",
                "Newfoundland and Labrador": "NL",
                "Prince Edward Island": "PE",
                "Northwest Territories": "NT",
                Nunavut: "NU",
                Yukon: "YT",
            };

            const code = provinceName === "All Provinces" ? undefined : provinceMapping[provinceName];
            const response = await fetchExclusiveProperties(code ? { province: code } : {});

            setProperties(response.results || []);
            setTotalCount(response.count || 0);
            prevProvinceRef.current = selectedProvince;
            setIsLoading(false);
        };

        load();
    }, [selectedProvince, getProvinceName]);

    return (
        <PropertyGridSection
            title="Exclusive Properties"
            subtitle={
                selectedProvince
                    ? `Exclusive in ${getProvinceName(selectedProvince)}`
                    : "Exclusive Properties"
            }
            viewAllHref="/listing"
            properties={properties}
            totalCount={totalCount}
            isLoading={isLoading}
            onQuickView={openQuickView}
        />
    );
}
