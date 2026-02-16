import React from "react";
import { MapPin } from "lucide-react";
import { ds } from "@/lib/design-system-utils";

interface PropertySidebarProps {
  property: any;
  city: string;
}

export default function PropertySidebar({
  property,
  city,
}: PropertySidebarProps) {
  const lat = property.latitude;
  const lon = property.longitude;

  return (
    <div className="space-y-6 sticky top-24">
      {/* Map Section */}
      <div className="bg-ds-card border border-ds-card-border rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-ds-heading mb-4">Location</h3>
        <div className="h-64 rounded-lg overflow-hidden border border-ds-card-border relative bg-gray-100">
          {lat && lon ? (
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon) - 0.005},${parseFloat(lat) - 0.005},${parseFloat(lon) + 0.005},${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat},${lon}`}
              style={{ border: "none" }}
            ></iframe>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <MapPin className="w-8 h-8 text-ds-body opacity-30 mb-2" />
              <p className="text-sm text-ds-body">
                Location details pinning...
              </p>
              <p className="text-xs text-ds-body/70 mt-1">
                {city}, {property.StateOrProvince || "Ontario"}
              </p>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-ds-body font-mono">
          <MapPin className="w-3 h-3" />
          {lat && lon ? (
            <span>
              {lat}, {lon}
            </span>
          ) : (
            <span>Coordinates not available</span>
          )}
        </div>
      </div>

      {/* Inquiry Form Placeholder */}
      <div className="bg-ds-primary text-white rounded-xl p-6 shadow-xl shadow-ds-primary/10">
        <h3 className="text-lg font-bold mb-2">Interested?</h3>
        <p className="text-sm text-white/80 mb-6">
          Get in touch with an expert about this property.
        </p>
        <button className="w-full py-3 bg-white text-ds-primary font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          Request Information
        </button>
      </div>

      {/* Share / Save Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-2 text-sm font-medium border border-ds-card-border rounded-lg hover:bg-ds-card transition-colors">
          Save
        </button>
        <button className="flex-1 py-2 text-sm font-medium border border-ds-card-border rounded-lg hover:bg-ds-card transition-colors">
          Share
        </button>
      </div>
    </div>
  );
}
