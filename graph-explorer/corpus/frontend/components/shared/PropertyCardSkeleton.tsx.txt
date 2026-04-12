"use client";

import { colors } from "@/config/design-system";

interface PropertyCardSkeletonProps {
  index?: number;
}

export function PropertyCardSkeleton({ index }: PropertyCardSkeletonProps) {
  // Breakpoint visibility logic from original components
  const visibilityClass =
    index !== undefined
      ? index === 0
        ? "block"
        : index === 1
          ? "hidden sm:block"
          : index === 2
            ? "hidden md:block"
            : index === 3
              ? "hidden lg:block"
              : index === 4
                ? "hidden xl:block"
                : index === 5
                  ? "hidden xl:block" // 6 at 1300+
                  : index < 8
                    ? "hidden 2xl:block"
                    : index < 10
                      ? "hidden 3xl:block"
                      : "hidden 4xl:block"
      : "block";

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden animate-pulse ${visibilityClass}`}
      style={{ border: `1px solid ${colors.cardsBoarder}` }}
    >
      <div
        className="aspect-[4/3] w-full"
        style={{ backgroundColor: colors.boarder }}
      />
      <div className="p-4 space-y-3 bg-white">
        <div
          className="h-5 w-1/2 rounded"
          style={{ backgroundColor: colors.boarder }}
        />
        <div
          className="h-4 w-3/4 rounded"
          style={{ backgroundColor: colors.boarder }}
        />
        <div
          className="h-3 w-full rounded"
          style={{ backgroundColor: colors.boarder }}
        />
        <div
          className="border-t my-2"
          style={{ borderColor: colors.cardsBoarder }}
        />
        <div className="flex gap-4">
          <div
            className="h-4 w-14 rounded"
            style={{ backgroundColor: colors.boarder }}
          />
          <div
            className="h-4 w-14 rounded"
            style={{ backgroundColor: colors.boarder }}
          />
        </div>
      </div>
    </div>
  );
}
