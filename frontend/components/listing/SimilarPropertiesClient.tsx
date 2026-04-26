"use client";

import React, { useState } from "react";
import { PropertyCard } from "@/components/listing/PropertyCard";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useCompare } from "@/contexts/CompareContext";
import { useWatched } from "@/contexts/WatchedContext";
import {
  getPropertyKey,
  formatPrice,
  getThumbnail,
  getPrice,
  getDetailUrl,
} from "@/lib/propertyUtils";
import { openInNewTab } from "@/lib/navigation/openInNewTab";
import { PropertyQuickViewModal } from "./PropertyQuickViewModal";

interface SimilarPropertiesClientProps {
  properties: any[];
}

export default function SimilarPropertiesClient({
  properties,
}: SimilarPropertiesClientProps) {
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProperty, setQuickViewProperty] = useState<any>(null);

  const handleQuickView = (property: any) => {
    setQuickViewProperty(property);
    setShowQuickView(true);
  };
  const { user } = useUserAuth();
  const isLoggedIn = !!user;

  const { isPropertySelected, addToCompare, removeFromCompare, compareList } =
    useCompare();
  const { addToHistory, getPropertyKey: getWatchedKey } = useWatched();

  const [clickedProperty, setClickedProperty] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handlePropertyClick = (property: any) => {
    const key = getPropertyKey(property);
    setClickedProperty(key);
    addToHistory(property);

    // If we are in comparison mode (have items), toggle comparison instead of navigating
    if (compareList.length > 0) {
      if (isPropertySelected(key)) {
        removeFromCompare(key);
      } else {
        addToCompare(property);
      }
      setTimeout(() => setClickedProperty(null), 300);
      return;
    }

    openInNewTab(getDetailUrl(property));
  };

  const handleImageLoad = (key: string) => {
    setLoadedImages((prev) => new Set(prev).add(key));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map((prop, index) => {
        const pKey = getPropertyKey(prop);
        return (
          <PropertyCard
            key={pKey}
            property={prop}
            propertyKey={pKey}
            isLoggedIn={isLoggedIn}
            isLocked={false}
            isSelected={isPropertySelected(pKey)}
            imageUrl={getThumbnail(prop)}
            imageLoaded={loadedImages.has(pKey)}
            cardLoaded={true}
            isClicked={clickedProperty === pKey}
            onCardClick={handlePropertyClick}
            onMouseEnter={() => {}}
            onQuickView={handleQuickView}
            onImageLoad={handleImageLoad}
            onImageError={() => {}}
            formatPrice={(price) => formatPrice(getPrice(prop))}
          />
        );
      })}

      <PropertyQuickViewModal
        show={showQuickView}
        property={quickViewProperty}
        onClose={() => setShowQuickView(false)}
      />
    </div>
  );
}
