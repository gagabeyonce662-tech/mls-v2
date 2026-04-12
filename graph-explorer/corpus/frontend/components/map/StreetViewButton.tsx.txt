// components/map/StreetViewButton.tsx
import React from "react";
import { openStreetView } from "@/lib/helpers";
import { ExternalLink } from "lucide-react";

export default function StreetViewButton({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  return (
    <button
      onClick={() => openStreetView(lat, lng)}
      className="mt-3 w-full px-4 py-2.5 bg-ds-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-ds-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      title="Open Street View in new tab"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      <span>Google Street View</span>
    </button>
  );
}
