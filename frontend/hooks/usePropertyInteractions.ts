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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const handlePropertyClick = useCallback(
    (property: Property) => {
      const key =
        getPropertyKey(property) ||
        (property as any).listing_key ||
        (property as any).PropertyKey;
      if (!key) return;

      setClickedProperty(key);
      addToHistory(property); // Track viewing
      const alreadySelected = isPropertySelected(key);

      if (compareList.length > 0) {
        if (alreadySelected) {
          removeFromCompare(key);
        } else {
          addToCompare(property);
        }
        setTimeout(() => setClickedProperty(null), 300);
        return;
      }

      setSelectedProperty(property);
      setShowCompareModal(true);
      setTimeout(() => setClickedProperty(null), 300);
    },
    [
      addToHistory,
      compareList.length,
      isPropertySelected,
      addToCompare,
      removeFromCompare,
    ],
  );

  const handleQuickView = useCallback((property: Property) => {
    setSelectedProperty(property);
    setShowQuickView(true);
  }, []);

  const handleCompareSelect = useCallback(() => {
    if (!selectedProperty) return;
    addToCompare(selectedProperty);
    setShowCompareModal(false);
    setSelectedProperty(null);
  }, [selectedProperty, addToCompare]);

  const handleViewFromModal = useCallback(() => {
    if (!selectedProperty) return;
    addToHistory(selectedProperty); // Track viewing
    setShowCompareModal(false);
    const key =
      getPropertyKey(selectedProperty) ||
      (selectedProperty as any).listing_key ||
      (selectedProperty as any).PropertyKey;
    router.push(`/listing/${key}`);
    setSelectedProperty(null);
  }, [selectedProperty, addToHistory, router]);

  const closeQuickView = useCallback(() => setShowQuickView(false), []);
  const closeCompareModal = useCallback(() => setShowCompareModal(false), []);

  return {
    clickedProperty,
    selectedProperty,
    showCompareModal,
    showQuickView,
    handlePropertyClick,
    handleQuickView,
    handleCompareSelect,
    handleViewFromModal,
    closeQuickView,
    closeCompareModal,
    isPropertySelected,
  };
}
