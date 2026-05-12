"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PropertyGridLayout } from "@/components/listing/PropertyGridLayout";
import { usePropertyInteractions } from "@/hooks/usePropertyInteractions";
import { useUserAuth } from "@/contexts/UserAuthContext";
import {
  fetchPreConnProperties,
  mapEstatePropertyFromAPI,
} from "@/lib/api/properties";
import { fetchEstateProperties } from "@/lib/api/admin";
import { Property } from "@/lib/api/types";
import { SlidersHorizontal, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colors } from "@/config/design-system";
import PropertyFilter from "@/components/PropertyFilter";

export default function PreConstructionPageClient() {
  const { user } = useUserAuth();
  const isLoggedIn = !!user;
  const interactions = usePropertyInteractions();

  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);
  const [initialLimit, setInitialLimit] = React.useState(8);
  const [searchQuery] = React.useState("");

  React.useEffect(() => {
    const calculateInitialItems = () => {
      if (typeof window === "undefined") return 8;
      const width = window.innerWidth;
      if (width >= 1800) return 16;
      if (width >= 1536) return 12;
      if (width >= 1280) return 8;
      if (width >= 1024) return 6;
      if (width >= 640) return 4;
      return 4;
    };

    setInitialLimit(calculateInitialItems());
    const handleResize = () => setInitialLimit(calculateInitialItems());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const fetchPrecons = async () => {
      setIsLoading(true);
      try {
        const [preConnData, estateData] = await Promise.all([
          fetchPreConnProperties({ limit: 100 }),
          fetchEstateProperties({ page_size: 100 }),
        ]);

        const preConMapped = (preConnData?.results || []) as Property[];
        const estateMapped = (estateData?.results || []).map((row: any) =>
          mapEstatePropertyFromAPI(row, String(row?.id || "")),
        );
        const merged = [...preConMapped, ...estateMapped];

        if (mounted) setProperties(merged);
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

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter((p) => {
      const name = (p.project_name || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      const dev = ((p as any).developer || "").toLowerCase();
      return name.includes(q) || addr.includes(q) || dev.includes(q);
    });
  }, [properties, searchQuery]);

  const displayedProperties = useMemo(() => {
    return showAll ? filteredProperties : filteredProperties.slice(0, initialLimit);
  }, [filteredProperties, showAll, initialLimit]);

  const builderLogoUrl = useMemo(() => {
    const detectedLogo = properties
      .map((p: any) => p?.builder_logo || p?.developer_logo || p?.logo_url || p?.logo)
      .find((url: string | undefined) => typeof url === "string" && url.trim().length > 0);

    return detectedLogo || "https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png";
  }, [properties]);

  const emptyMessage = (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-32 text-center shadow-inner">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <SlidersHorizontal className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-ds-heading">
          No Pre-Construction Properties Found
        </h3>
        <p className="text-ds-body leading-relaxed">
          We couldn&apos;t find any pre-construction projects at this time.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 pt-32 pb-16 px-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ds-primary">
              <HardHat className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-bold uppercase tracking-wider text-orange-600">
                New Developments
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-ds-heading font-inter">
              Pre-Construction Projects
            </h1>
            <p className="text-ds-body text-lg">
              Explore the latest builder developments, townhomes, and condos
              before they are built.
            </p>
          </div>
        </div>

        <div
          className="-mx-4 lg:-mx-6 px-4 lg:px-6 pb-2 pt-2 transition-all duration-300 origin-top"
          style={{ backgroundColor: colors.cards }}
        >
          <PropertyFilter variant="horizontal" />
        </div>

        <PropertyGridLayout
          properties={displayedProperties as any}
          isLoading={isLoading}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={() => {}}
          isLoggedIn={isLoggedIn}
          interactions={interactions}
          emptyMessage={emptyMessage}
        />

        {!showAll && properties.length > initialLimit && !isLoading && (
          <div className="mt-16 flex justify-center">
            <Button
              onClick={() => setShowAll(true)}
              className="px-12 py-7 rounded-full text-lg font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all text-white bg-ds-primary"
            >
              View All {properties.length} Projects
            </Button>
          </div>
        )}

        <section className="mt-16 sm:mt-20">
          <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/60 px-6 py-10 sm:px-10 sm:py-12 shadow-[0_20px_60px_-30px_rgba(146,64,14,0.45)]">
            <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-orange-200/20 blur-3xl" />

            <div className="relative mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700/80">
                Featured Builder
              </p>

              <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 px-6 py-8 sm:px-12 sm:py-10 backdrop-blur-sm shadow-[0_14px_36px_-24px_rgba(0,0,0,0.45)]">
                <Image
                  src={builderLogoUrl}
                  alt="Builder Logo"
                  width={520}
                  height={170}
                  className="mx-auto h-28 sm:h-32 md:h-36 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
