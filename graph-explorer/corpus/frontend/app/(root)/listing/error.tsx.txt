"use client";

import { useEffect } from "react";
import { colors } from "@/config/design-system";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: colors.heading }}>
        Something went wrong!
      </h2>
      <p className="mb-6 text-center max-w-md" style={{ color: colors.body }}>
        We encountered an error while loading the property listings. Please try
        again.
      </p>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
        style={{ backgroundColor: colors.primary }}
      >
        Try again
      </button>
    </div>
  );
}
