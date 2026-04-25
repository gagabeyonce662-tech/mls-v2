"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, AlertCircle } from "lucide-react";

// Hooks and Contexts
import {
  useCompareProperties,
  useAllExclusiveProperties,
} from "@/hooks/react-query";
import { useCompare } from "@/contexts/CompareContext";
import { Property } from "@/lib/api/types";

// Components
import { ComparisonProperty } from "./components/types";
import { AddPropertiesModal } from "./components/AddPropertiesModal";
import { ComparisonTable } from "./components/ComparisonTable";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "./components/CompareStates";
import { transformPropertyData } from "./components/utils";

function ComparePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    compareList,
    addToCompare,
    removeFromCompare: removeFromGlobalCompare,
    getPropertyKey,
  } = useCompare();

  // Get current IDs from URL
  const urlIds = useMemo(() => {
    const ids = params?.get("ids");
    if (!ids) return [];
    return ids
      .split(",")
      .map((id: string) => decodeURIComponent(id).trim())
      .filter(Boolean);
  }, [params]);

  const [selectedIds, setSelectedIds] = useState<string[]>(urlIds);
  const [showAddPropertiesModal, setShowAddPropertiesModal] = useState(false);

  // Helper to update URL when selectedIds change locally (adding/removing)
  const updateUrl = useCallback(
    (ids: string[]) => {
      const newParams = new URLSearchParams();
      if (ids.length > 0) {
        newParams.set("ids", ids.join(","));
        router.replace(`/compare?${newParams.toString()}`, { scroll: false });
      } else {
        router.replace("/compare", { scroll: false });
      }
    },
    [router],
  );

  // Sync state with URL if URL changes (e.g. back/forward navigation)
  useEffect(() => {
    if (
      urlIds.length > 0 &&
      JSON.stringify(urlIds) !== JSON.stringify(selectedIds)
    ) {
      setSelectedIds(urlIds);
    }
  }, [urlIds, selectedIds]);

  // Populate from global context automatically if page is hit directly
  useEffect(() => {
    if (
      selectedIds.length === 0 &&
      compareList &&
      compareList.length > 0 &&
      !params?.get("ids")
    ) {
      const globalIds = compareList.map((p: any) => getPropertyKey(p));
      setSelectedIds(globalIds);
      updateUrl(globalIds);
    }
  }, [compareList, getPropertyKey, params, selectedIds.length, updateUrl]);

  const {
    data: compareData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCompareProperties(selectedIds, {
    enabled: selectedIds.length > 0,
  });

  const {
    data: availablePropertiesData,
    isLoading: isLoadingAvailable,
    isError: isErrorAvailable,
  } = useAllExclusiveProperties({
    enabled: showAddPropertiesModal,
  });

  // Transform available data
  const availablePropertiesDataArray = useMemo(() => {
    if (!availablePropertiesData) return [];
    if (Array.isArray(availablePropertiesData)) return availablePropertiesData;
    const dataObj = availablePropertiesData as any;
    if (dataObj && typeof dataObj === "object") {
      if ("results" in dataObj && Array.isArray(dataObj.results))
        return dataObj.results;
      if (dataObj.listing_key) return [dataObj];
    }
    return [];
  }, [availablePropertiesData]);

  // Transform data for comparison
  const comparisonProperties = useMemo((): ComparisonProperty[] => {
    if (!selectedIds.length) return [];
    if (
      !compareData ||
      !compareData.results ||
      compareData.results.length === 0
    ) {
      return selectedIds.map((id) => ({
        id,
        image: "",
        price: "Loading...",
        address: "Loading property...",
        municipality: "",
        province: "",
        postalCode: "",
        propertyType: "",
        bedrooms: 0,
        bathrooms: 0,
        totalRooms: 0,
        yearBuilt: null,
        garage: "",
        airConditioning: "",
        basement: "",
        zoning: "",
        error: "Loading data...",
      }));
    }

    return selectedIds.map((id) => transformPropertyData(id, compareData));
  }, [selectedIds, compareData]);

  const handleAddProperty = (property: any) => {
    if (selectedIds.length >= 5) {
      alert("You can only compare up to 5 properties at a time.");
      return;
    }

    const propertyId = getPropertyKey(property);
    if (!selectedIds.includes(propertyId)) {
      const newSelectedIds = [...selectedIds, propertyId];
      setSelectedIds(newSelectedIds);
      updateUrl(newSelectedIds);
      addToCompare(property);
      setShowAddPropertiesModal(false);
    }
  };

  const handleRemoveProperty = (propertyId: string) => {
    const newSelectedIds = selectedIds.filter((id) => id !== propertyId);
    setSelectedIds(newSelectedIds);
    updateUrl(newSelectedIds);
    removeFromGlobalCompare(propertyId);
  };

  if (isLoading && selectedIds.length > 0) {
    return (
      <div className="root-content-offset min-h-screen bg-gray-50">
        <Header />
        <LoadingState
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
        />
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="root-content-offset min-h-screen bg-gray-50">
        <Header />
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          onClear={() => setSelectedIds([])}
        />
        <Footer />
      </div>
    );
  }

  if (selectedIds.length === 0) {
    return (
      <div className="root-content-offset min-h-screen bg-gray-50">
        <Header />
        <EmptyState />
        <Footer />
      </div>
    );
  }

  const errorProperties = comparisonProperties.filter((p) => p.error);

  return (
    <div className="root-content-offset min-h-screen bg-gray-50">
      <Header />

      <div className="w-full px-2 sm:px-4 lg:px-6 2xl:px-8 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.5)] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6 border-b border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Side by Side Analysis
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Compare Properties
                </h1>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
                {comparisonProperties.length}/5 Selected
              </div>
            </div>

            {/* Error Alert */}
            {errorProperties.length > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      {errorProperties.length} propert
                      {errorProperties.length === 1 ? "y" : "ies"} failed to
                      load
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Some properties could not be loaded. They may have been
                      removed or there might be a temporary issue.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* COMPARISON TABLE */}
          <ComparisonTable
            properties={comparisonProperties}
            onRemove={handleRemoveProperty}
            onAddClick={() => setShowAddPropertiesModal(true)}
          />
        </div>
      </div>

      <Footer />

      {/* ADD PROPERTIES MODAL */}
      <AddPropertiesModal
        isOpen={showAddPropertiesModal}
        onClose={() => setShowAddPropertiesModal(false)}
        selectedIds={selectedIds}
        isLoadingAvailable={isLoadingAvailable}
        isErrorAvailable={isErrorAvailable}
        availablePropertiesDataArray={availablePropertiesDataArray}
        handleAddProperty={handleAddProperty}
        handleRemoveProperty={handleRemoveProperty}
        router={router}
      />
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-semibold">Loading Comparison...</p>
          </div>
        </div>
      }
    >
      <ComparePageContent />
    </React.Suspense>
  );
}
