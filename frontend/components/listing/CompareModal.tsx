"use client";

import React from "react";
import { colors } from "@/config/design-system";

interface CompareModalProps {
  show: boolean;
  selectedProperty: any;
  onClose: () => void;
  onViewDetails: () => void;
  onAddToCompare: () => void;
  formatPrice: (price: any) => string;
}

export const CompareModal = ({
  show,
  selectedProperty,
  onClose,
  onViewDetails,
  onAddToCompare,
  formatPrice,
}: CompareModalProps) => {
  if (!show || !selectedProperty) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3
          className="text-xl font-semibold mb-4 text-center"
          style={{ color: colors.heading }}
        >
          What would you like to do?
        </h3>

        <div
          className="mb-4 p-4 rounded-lg"
          style={{ backgroundColor: colors.boarder }}
        >
          <p className="font-medium" style={{ color: colors.heading }}>
            {selectedProperty.category_type ||
              selectedProperty.PropertySubType ||
              "Property"}{" "}
            in{" "}
            {selectedProperty.city || selectedProperty.City || "Unknown City"}
          </p>
          <p
            className="text-lg font-bold mt-1"
            style={{ color: colors.primary }}
          >
            {formatPrice(
              selectedProperty.list_price || selectedProperty.ListPrice,
            )}
          </p>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={onViewDetails}
            className="flex-1 text-center py-3 rounded-xl font-medium transition hover:opacity-90"
            style={{ backgroundColor: colors.primary, color: colors.cards }}
          >
            View Details
          </button>

          <button
            onClick={onAddToCompare}
            className="flex-1 py-3 rounded-xl font-medium transition hover:opacity-90"
            style={{ backgroundColor: colors.heading, color: colors.cards }}
          >
            Add to Compare
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2"
          style={{ color: colors.body }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
