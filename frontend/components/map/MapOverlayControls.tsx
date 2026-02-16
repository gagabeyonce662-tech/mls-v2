import { motion } from "framer-motion";
import { Pencil, X, Trash2, Loader2 } from "lucide-react";
import SearchBox from "./SearchBox";
import FilterBar from "./FilterBar";

interface MapOverlayControlsProps {
  searchQuery: string;
  onInputChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  clearSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  filters: any;
  setFilters: (f: any) => void;
  applyFilters: () => void;
  drawing: boolean;
  onToggleDrawing: () => void;
  onClearAll: () => void;
  loading: boolean;
}

export const MapOverlayControls = ({
  searchQuery,
  onInputChange,
  onKeyDown,
  clearSearch,
  inputRef,
  filters,
  setFilters,
  applyFilters,
  drawing,
  onToggleDrawing,
  onClearAll,
  loading,
}: MapOverlayControlsProps) => {
  return (
    <>
      <div className="absolute top-4 left-0 right-0 z-[1000] px-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 pointer-events-auto">
          {/* Search Box */}
          <div className="w-full md:w-80 shadow-2xl">
            <div className="relative group">
              <SearchBox
                inputRef={inputRef}
                value={searchQuery}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                onClear={clearSearch}
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex-1 w-full shadow-2xl">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilters}
              transparent={true}
              className="backdrop-blur-md bg-white/90"
            />
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleDrawing}
              className={`p-3 rounded-xl shadow-xl border flex items-center justify-center transition-all ${
                drawing
                  ? "bg-red-500 text-white border-red-600"
                  : "bg-white text-ds-heading border-ds-card-border hover:bg-ds-card"
              }`}
              title={drawing ? "Cancel Drawing" : "Draw Area on Map"}
            >
              {drawing ? (
                <X className="w-5 h-5" />
              ) : (
                <Pencil className="w-5 h-5" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearAll}
              className="p-3 bg-white text-ds-heading border border-ds-card-border rounded-xl shadow-xl hover:bg-ds-card transition-all"
              title="Clear All Markers"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute top-24 right-4 z-[1000]">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-ds-card-border flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-ds-primary" />
            <span className="text-xs font-bold text-ds-heading">
              Updating Results...
            </span>
          </div>
        </div>
      )}
    </>
  );
};
