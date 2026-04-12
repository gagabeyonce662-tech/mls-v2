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
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: colors.heading }}>
        Something went wrong!
      </h2>
      <button
        onClick={() => reset()}
        className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
        style={{ backgroundColor: colors.primary }}
      >
        Try again
      </button>
    </div>
  );
}
