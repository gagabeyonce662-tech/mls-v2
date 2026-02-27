import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Home } from "lucide-react";
import PropertyCard from "./PropertyCard";
import { PropertyMarker } from "./types";

interface MapSidebarProps {
  apiMarkers: PropertyMarker[];
  selectedPropertyId: string | null;
  onViewOnMap: (property: PropertyMarker) => void;
  onViewStreetView: (property: PropertyMarker) => void;
}

export const MapSidebar = ({
  apiMarkers,
  selectedPropertyId,
  onViewOnMap,
  onViewStreetView,
}: MapSidebarProps) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  if (apiMarkers.length === 0) return null;

  return (
    <>
      {/* ══════════ DESKTOP sidebar (xl+) ══════════ */}
      <motion.aside
        initial={{ x: -420 }}
        animate={{ x: 0 }}
        className="absolute top-4 left-4 bottom-4 hidden xl:flex w-[360px] flex-col rounded-2xl overflow-hidden shadow-2xl border border-ds-card-border bg-white/95 backdrop-blur-md z-[500]"
      >
        <div className="p-6 border-b border-ds-card-border bg-ds-card">
          <h2 className="text-xl font-bold text-ds-heading">
            Properties in View
          </h2>
          <p className="text-sm text-ds-body">
            Showing {apiMarkers.length} matching homes
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {apiMarkers.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onViewOnMap={() => onViewOnMap(property)}
              onViewStreetView={() => onViewStreetView(property)}
              isSelected={selectedPropertyId === property.id}
            />
          ))}
        </div>
      </motion.aside>

      {/* ══════════ MOBILE bottom sheet (below xl) ══════════ */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[40] pointer-events-none">
        <AnimatePresence>
          {/* Peek bar — always visible */}
          <motion.div
            layout
            className="pointer-events-auto bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-x border-ds-card-border"
          >
            {/* Drag handle + header */}
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="w-full flex flex-col items-center pt-2 pb-3 px-4"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-ds-primary" />
                  <span className="text-sm font-bold text-ds-heading">
                    {apiMarkers.length} Properties Found
                  </span>
                </div>
                {mobileExpanded ? (
                  <ChevronDown className="w-5 h-5 text-ds-body" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-ds-body" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {mobileExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "50vh" }}
                  exit={{ height: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="overflow-hidden"
                >
                  <div className="h-full overflow-y-auto p-4 space-y-4 no-scrollbar border-t border-ds-card-border">
                    {apiMarkers.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onViewOnMap={() => {
                          onViewOnMap(property);
                          setMobileExpanded(false);
                        }}
                        onViewStreetView={() => onViewStreetView(property)}
                        isSelected={selectedPropertyId === property.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};
