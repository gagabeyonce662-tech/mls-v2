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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Auto-open the desktop tray after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ══════════ MOBILE (below lg) ══════════ */}

      {/* Mobile top bar: search + filter toggle */}
      <div className="absolute top-3 left-3 right-3 z-[40] flex items-center gap-2 lg:hidden pointer-events-auto">
        <div className="flex-1 shadow-md rounded-xl">
          <SearchBox
            inputRef={inputRef}
            value={searchQuery}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onClear={clearSearch}
          />
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex-shrink-0 p-3.5 rounded-xl border bg-white text-ds-heading border-ds-card-border shadow-md active:scale-95 transition-transform"
          title="Open Filters"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile filter bottom sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/40 z-[2000] lg:hidden"
            />
            <motion.div
              key="mobile-sheet"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[360px] z-[2001] lg:hidden flex flex-col bg-white shadow-2xl"
            >

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-ds-card-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-ds-primary" />
                  <span className="text-sm font-bold text-ds-heading">Filters</span>
                </div>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 rounded-lg hover:bg-ds-card transition-colors"
                >
                  <X className="w-5 h-5 text-ds-body" />
                </button>
              </div>

              {/* Filter content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  onApply={() => {
                    applyFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="border-0 shadow-none rounded-none"
                />
              </div>

              {/* Mobile action buttons */}
              <div className="p-4 border-t border-ds-card-border flex gap-2 bg-white safe-bottom">
                <button
                  onClick={() => {
                    onToggleDrawing();
                    setMobileFiltersOpen(false);
                  }}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${drawing
                    ? "bg-red-500 text-white border-red-600"
                    : "bg-ds-card text-ds-heading border-ds-card-border"
                    }`}
                >
                  {drawing ? <><X className="w-4 h-4" /><span>Cancel</span></> : <><Pencil className="w-4 h-4" /><span>Draw</span></>}
                </button>
                <button
                  onClick={() => {
                    onClearAll();
                    setMobileFiltersOpen(false);
                  }}
                  className="flex-1 p-3 bg-ds-card text-ds-heading border border-ds-card-border rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" /><span>Clear</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ DESKTOP (lg and above) ══════════ */}

      {/* Collapsed tab */}
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

      {/* Full panel */}
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

              <div className="p-3 border-b border-ds-card-border h-[96px] bg-[#f5f5f5]">
                <SearchBox
                  inputRef={inputRef}
                  value={searchQuery}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  onClear={clearSearch}
                />
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  onApply={applyFilters}
                  className="border-0 shadow-none rounded-none"
                />
              </div>

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
