import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWatched } from "@/contexts/WatchedContext";
import { useCompare } from "@/contexts/CompareContext";
import { getPropertyKey } from "@/lib/propertyUtils";
import { Property } from "@/lib/api";

export function usePropertyInteractions() {
  const router = useRouter();
  const { addToHistory } = useWatched();
  const { compareList, addToCompare, removeFromCompare, isPropertySelected } =
    useCompare();

  const [clickedProperty, setClickedProperty] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handlePropertyClick = useCallback(
    (property: Property) => {
      const key =
        getPropertyKey(property) ||
        (property as any).listing_key ||
        (property as any).PropertyKey;
      if (!key) return;

      setClickedProperty(key);
      addToHistory(property); // Track viewing
      router.push(`/listing/${key}`);
      setTimeout(() => setClickedProperty(null), 500);
    },
    [router, addToHistory],
  );

  const handleToggleCompare = useCallback(
    (property: Property) => {
      const key =
        getPropertyKey(property) ||
        (property as any).listing_key ||
        (property as any).PropertyKey;
      if (!key) return;

      const alreadySelected = isPropertySelected(key);
      if (alreadySelected) {
        removeFromCompare(key);
      } else {
        addToCompare(property);
      }
    },
    [isPropertySelected, removeFromCompare, addToCompare],
  );

  const handleCompareSelect = useCallback(
    (property: Property) => {
      setSelectedProperty(property);
      setShowCompareModal(true);
    },
    [],
  );

  const handleQuickView = useCallback(
    (property: Property) => {
      setSelectedProperty(property);
      setShowQuickView(true);
    },
    [],
  );

  const handleViewFromModal = useCallback(() => {
    if (selectedProperty) {
      handlePropertyClick(selectedProperty);
    }
    setShowCompareModal(false);
  }, [selectedProperty, handlePropertyClick]);

  const closeCompareModal = useCallback(() => {
    setShowCompareModal(false);
    setSelectedProperty(null);
  }, []);

  const closeQuickView = useCallback(() => {
    setShowQuickView(false);
    setSelectedProperty(null);
  }, []);

  return {
    clickedProperty,
    selectedProperty,
    showQuickView,
    showCompareModal,
    handlePropertyClick,
    handleToggleCompare,
    handleCompareSelect,
    handleQuickView,
    handleViewFromModal,
    closeCompareModal,
    closeQuickView,
    isPropertySelected,
    compareList,
  };
}
