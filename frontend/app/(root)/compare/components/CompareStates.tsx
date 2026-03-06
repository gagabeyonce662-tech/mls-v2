import React from "react";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";

export function LoadingState({
  selectedCount,
  selectedIds,
}: {
  selectedCount: number;
  selectedIds: string[];
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Loading Properties</h2>
        <p className="text-gray-400 mb-4">
          Comparing {selectedCount} propert{selectedCount === 1 ? "y" : "ies"}
          ...
        </p>
        <div className="text-sm text-gray-500">
          <p>Selected IDs: {selectedIds.join(", ")}</p>
        </div>
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  onClear,
}: {
  error: any;
  onRetry: () => void;
  onClear: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Properties</h2>
        <p className="text-gray-300 mb-4">
          Failed to load comparison data. Please try again.
        </p>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-sm font-mono text-left break-all">
            {error?.message || "Unknown error"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={onClear}
            className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Plus className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4">No Properties Selected</h1>
        <p className="text-gray-400 mb-8">
          Select properties from our exclusive listings to compare their
          features side by side.
        </p>
      </div>
    </div>
  );
}
