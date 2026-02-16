import { motion } from "framer-motion";
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
  if (apiMarkers.length === 0) return null;

  return (
    <motion.aside
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      className="hidden xl:flex w-[400px] bg-white border-l border-ds-card-border flex-col shadow-2xl z-10"
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
  );
};
