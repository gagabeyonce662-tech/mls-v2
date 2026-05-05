import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Trash2, Loader2, SlidersHorizontal, ChevronRight } from "lucide-react";
import SearchBox from "./SearchBox";
import FilterBar from "./FilterBar";
import { useWatched } from "@/contexts/WatchedContext";

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
  drawingMode: "rectangle" | "polygon" | null;
  onStartRectangleDrawing: () => void;
  onStartPolygonDrawing: () => void;
  onCancelDrawing: () => void;
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
  drawingMode,
  onStartRectangleDrawing,
  onStartPolygonDrawing,
  onCancelDrawing,
  onClearAll,
  loading,
}: MapOverlayControlsProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { followedAreas } = useWatched();

  const toggleStatus = (status: "active" | "sold" | "de-listed") => {
    setFilters((prev: any) => {
      const current = Array.isArray(prev.statuses) ? prev.statuses : [];
      const exists = current.includes(status);
      const nextStatuses = exists
        ? current.filter((x: string) => x !== status)
        : [...current, status];
      return { ...prev, statuses: nextStatuses };
    });
  };

  const applyWatchedArea = (value: string) => {
    if (!value) {
      setFilters((prev: any) => ({
        ...prev,
        watched_area_key: "",
        watched_area_city: "",
        watched_area_community_slug: "",
        watched_area_label: "",
      }));
      return;
    }
    const selected = followedAreas.find((area) => area.area_key === value);
    const metadata =
      selected && selected.metadata_json && typeof selected.metadata_json === "object"
        ? (selected.metadata_json as Record<string, unknown>)
        : {};
    const city =
      typeof metadata.city === "string"
        ? metadata.city
        : typeof metadata.city_name === "string"
          ? metadata.city_name
          : "";
    const communitySlug =
      typeof metadata.community_slug === "string"
        ? metadata.community_slug
        : typeof metadata.slug === "string"
          ? metadata.slug
          : "";
    setFilters((prev: any) => ({
      ...prev,
      watched_area_key: value,
      watched_area_city: city,
      watched_area_community_slug: communitySlug,
      watched_area_label: selected?.area_label ?? "",
    }));
  };

  // Auto-open is now handled by initial state to sync with left sidebar

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

      <div className="absolute top-20 left-3 right-3 z-[45] lg:hidden pointer-events-auto space-y-2">
        <div className="rounded-xl border border-ds-card-border bg-white p-2 shadow-md">
          <div className="flex gap-2">
            {[
              { key: "active", label: "Active" },
              { key: "sold", label: "Sold" },
              { key: "de-listed", label: "De-listed" },
            ].map((item) => {
              const selected = (filters.statuses ?? []).includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleStatus(item.key as "active" | "sold" | "de-listed")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selected
                    ? "bg-ds-primary text-white border-ds-primary"
                    : "bg-white text-ds-body border-ds-card-border"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {(filters.statuses ?? []).includes("active") && (
            <select
              value={filters.active_listed_within ?? ""}
              onChange={(e) =>
                setFilters((prev: any) => ({
                  ...prev,
                  active_listed_within: e.target.value,
                }))
              }
              className="mt-2 w-full text-xs rounded-lg border border-ds-card-border px-2 py-1.5"
            >
              <option value="">All active listings</option>
              <option value="1">Listed in 24 hours</option>
              <option value="7">Listed in 7 days</option>
              <option value="30">Listed in 30 days</option>
            </select>
          )}
        </div>
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
                  <span className="text-sm font-bold text-ds-heading">
                    Filters
                  </span>
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
                {followedAreas.length > 0 && (
                  <div className="px-5 pt-4">
                    <label className="text-[10px] font-bold text-ds-body uppercase tracking-widest pl-1 block mb-1.5">
                      Watched Areas
                    </label>
                    <select
                      value={filters.watched_area_key ?? ""}
                      onChange={(e) => applyWatchedArea(e.target.value)}
                      className="w-full rounded-xl border border-ds-card-border px-3 py-2 text-sm text-ds-heading"
                    >
                      <option value="">All areas</option>
                      {followedAreas.map((area) => (
                        <option key={area.area_key} value={area.area_key}>
                          {area.area_label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                    if (drawing) {
                      onCancelDrawing();
                    } else {
                      onStartRectangleDrawing();
                    }
                    setMobileFiltersOpen(false);
                  }}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${drawing
                    ? "bg-red-500 text-white border-red-600"
                    : "bg-ds-card text-ds-heading border-ds-card-border"
                    }`}
                >
                  {drawing ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4" />
                      <span>Draw Rectangle</span>
                    </>
                  )}
                </button>
                {!drawing && (
                  <button
                    onClick={() => {
                      onStartPolygonDrawing();
                      setMobileFiltersOpen(false);
                    }}
                    className="flex-1 p-3 bg-ds-card text-ds-heading border border-ds-card-border rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Draw Polygon</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onClearAll();
                    setMobileFiltersOpen(false);
                  }}
                  className="flex-1 p-3 bg-ds-card text-ds-heading border border-ds-card-border rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
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
            className="absolute top-0 bottom-0 right-0 z-30 hidden lg:flex items-center pointer-events-none"
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
            transition={{ type: "tween", ease: "easeOut", duration: 0.4 }}
            className="absolute top-4 right-4 bottom-4 z-30 w-[clamp(320px,23vw,360px)] hidden lg:flex flex-col pointer-events-auto"
          >
            <div className="flex flex-col h-full rounded-2xl border border-ds-card-border bg-white/95 backdrop-blur-sm shadow-md overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-ds-card-border bg-ds-card/60">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-ds-primary" />
                  <span className="text-xs font-bold text-ds-heading uppercase tracking-widest">
                    Filters
                  </span>
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
                <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-2">
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "active", label: "Active" },
                      { key: "sold", label: "Sold" },
                      { key: "de-listed", label: "De-listed" },
                    ].map((item) => {
                      const selected = (filters.statuses ?? []).includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() =>
                            toggleStatus(item.key as "active" | "sold" | "de-listed")
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selected
                            ? "bg-ds-primary text-white border-ds-primary"
                            : "bg-white text-ds-body border-ds-card-border"
                            }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  {(filters.statuses ?? []).includes("active") && (
                    <select
                      value={filters.active_listed_within ?? ""}
                      onChange={(e) =>
                        setFilters((prev: any) => ({
                          ...prev,
                          active_listed_within: e.target.value,
                        }))
                      }
                      className="mt-2 w-full text-xs rounded-lg border border-ds-card-border px-2 py-1.5"
                    >
                      <option value="">All active listings</option>
                      <option value="1">Listed in 24 hours</option>
                      <option value="7">Listed in 7 days</option>
                      <option value="30">Listed in 30 days</option>
                    </select>
                  )}
                  {followedAreas.length > 0 && (
                    <select
                      value={filters.watched_area_key ?? ""}
                      onChange={(e) => applyWatchedArea(e.target.value)}
                      className="mt-2 w-full text-xs rounded-lg border border-ds-card-border px-2 py-1.5"
                    >
                      <option value="">All watched areas</option>
                      {followedAreas.map((area) => (
                        <option key={area.area_key} value={area.area_key}>
                          {area.area_label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {drawing ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancelDrawing}
                    className="w-full p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm font-semibold bg-red-500 text-white border-red-600"
                    title="Cancel Drawing"
                  >
                    <X className="w-4 h-4" />
                    <span>
                      Cancel {drawingMode === "polygon" ? "Polygon" : "Rectangle"} Drawing
                    </span>
                  </motion.button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStartRectangleDrawing}
                      className="p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm font-semibold bg-ds-card text-ds-heading border-ds-card-border hover:bg-white hover:border-ds-primary hover:text-ds-primary"
                      title="Draw Rectangle"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Rectangle</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStartPolygonDrawing}
                      className="p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm font-semibold bg-ds-card text-ds-heading border-ds-card-border hover:bg-white hover:border-ds-primary hover:text-ds-primary"
                      title="Draw Polygon"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Polygon</span>
                    </motion.button>
                  </div>
                )}

                {drawing && drawingMode === "polygon" && (
                  <div className="rounded-lg border border-ds-card-border bg-ds-card px-3 py-2 text-xs text-ds-body">
                    Click map to add points (3-5 max). Double-click or right-click to finish, or auto-finish at 5 points.
                  </div>
                )}

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
                    <span className="text-xs font-bold text-ds-heading">
                      Updating Results...
                    </span>
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
