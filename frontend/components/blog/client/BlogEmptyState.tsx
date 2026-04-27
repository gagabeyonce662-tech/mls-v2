"use client";

import { colors } from "@/config/design-system";

export function BlogEmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 mb-4"
        style={{ color: colors.body }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-lg font-medium mb-2" style={{ color: colors.heading }}>
        No blogs found
      </h3>
      <p style={{ color: colors.body }}>
        Try adjusting your search or category filters.
      </p>
    </div>
  );
}
