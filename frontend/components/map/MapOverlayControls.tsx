import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Trash2, Loader2, SlidersHorizontal, ChevronRight } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open the tray after a brief delay so the user sees the slide-in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Collapsed tab button — visible only when panel is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="tab"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="absolute top-0 bottom-0 right-0 z-[1000] hidden lg:flex items-center pointer-events-none"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center gap-2 bg-white border border-ds-card-border border-r-0 rounded-l-2xl shadow-lg px-2 py-4 pointer-events-auto hover:bg-ds-card transition-colors group"
              title="Open Filters"
            >
              <SlidersHorizontal className="w-5 h-5 text-ds-primary" />
              <span
                className="text-[10px] font-bold text-ds-body uppercase tracking-widest group-hover:text-ds-primary transition-colors"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                Filters
              </span>
              <ChevronRight className="w-4 h-4 text-ds-body group-hover:text-ds-primary transition-colors" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full panel — slides in from the right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ x: 60, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
            className="absolute top-4 right-4 bottom-4 z-[1000] w-[360px] hidden lg:flex flex-col pointer-events-auto"
          >
            <div className="flex flex-col h-full rounded-2xl border border-ds-card-border bg-white/95 backdrop-blur-sm shadow-md overflow-hidden">

              {/* Header with minimize button */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-ds-card-border bg-ds-card/60">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-ds-primary" />
                  <span className="text-xs font-bold text-ds-heading uppercase tracking-widest">Filters</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-ds-card-border transition-colors text-ds-body hover:text-ds-primary"
                  title="Minimize panel"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Search Box */}
              <div className="p-3 border-b border-ds-card-border h-[96px] bg-[#f5f5f5]">
                <SearchBox
                  inputRef={inputRef}
                  value={searchQuery}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  onClear={clearSearch}
                />
              </div>

              {/* Vertical Filter Panel */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  onApply={applyFilters}
                  transparent={false}
                  vertical={true}
                  className="border-0 shadow-none rounded-none"
                />
              </div>

              {/* Action Tools */}
              <div className="p-3 border-t border-ds-card-border flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onToggleDrawing}
                  className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm font-semibold ${drawing
                    ? "bg-red-500 text-white border-red-600"
                    : "bg-ds-card text-ds-heading border-ds-card-border hover:bg-white hover:border-ds-primary hover:text-ds-primary"
                    }`}
                  title={drawing ? "Cancel Drawing" : "Draw Area on Map"}
                >
                  {drawing ? (
                    <><X className="w-4 h-4" /><span>Cancel Drawing</span></>
                  ) : (
                    <><Pencil className="w-4 h-4" /><span>Draw Area</span></>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClearAll}
                  className="w-full p-3 bg-ds-card text-ds-heading border border-ds-card-border rounded-xl hover:bg-white hover:border-ds-primary hover:text-ds-primary transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                  title="Clear All Markers"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </motion.button>

                {loading && (
                  <div className="bg-ds-card px-4 py-2 rounded-lg border border-ds-card-border flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-ds-primary" />
                    <span className="text-xs font-bold text-ds-heading">Updating Results...</span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
