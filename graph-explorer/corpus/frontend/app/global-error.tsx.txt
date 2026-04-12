"use client";

import { useEffect } from "react";
import { colors } from "@/config/design-system";

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: colors.heading }}
          >
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
      </body>
    </html>
  );
}
