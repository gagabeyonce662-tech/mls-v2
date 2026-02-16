"use client";

import React from "react";
import Link from "next/link";
import { colors } from "@/config/design-system";

interface CompareBarProps {
  compareList: any[];
  onRemove: (property: any) => void;
  getPropertyKey: (property: any) => string;
}

export const CompareBar = ({
  compareList,
  onRemove,
  getPropertyKey,
}: CompareBarProps) => {
  if (compareList.length === 0) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-x-auto">
          {compareList.map((property) => (
            <div
              key={getPropertyKey(property)}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
            >
              <span className="truncate max-w-[120px]">
                {property.city || property.City || "Property"}
              </span>
              <button
                onClick={() => onRemove(property)}
                className="text-red-500 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <Link
          href={`/compare?ids=${compareList
            .map((p) => getPropertyKey(p))
            .join(",")}`}
          className="ml-4 px-5 py-2 rounded-lg font-medium transition hover:bg-blue-700 whitespace-nowrap"
          style={{ backgroundColor: colors.primary, color: colors.cards }}
        >
          Compare ({compareList.length})
        </Link>
      </div>
    </div>
  );
};
