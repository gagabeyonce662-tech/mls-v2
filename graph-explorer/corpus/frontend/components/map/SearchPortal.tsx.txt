// components/map/SearchPortal.tsx
import React from "react";
import ReactDOM from "react-dom";
import { NominatimResult } from "./types";
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResultsPortalProps {
  anchorRect: DOMRect | null;
  results: NominatimResult[];
  onSelect: (r: NominatimResult) => void;
}

export const ResultsPortal: React.FC<ResultsPortalProps> = ({
  anchorRect,
  results,
  onSelect,
}) => {
  if (typeof window === "undefined" || !anchorRect) return null;

  const top = anchorRect.bottom + window.scrollY + 8;
  const left = Math.max(16, anchorRect.left);
  const width = Math.min(anchorRect.width, window.innerWidth - 32);

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed z-[999999] bg-white rounded-2xl shadow-2xl border border-ds-card-border overflow-hidden"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          maxHeight: "400px",
        }}
        role="listbox"
      >
        <div className="overflow-y-auto no-scrollbar py-2">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => onSelect(r)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-ds-card transition-colors text-left"
            >
              <div className="mt-0.5 p-1.5 bg-gray-100 rounded-lg text-ds-primary">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ds-heading line-clamp-1">
                  {r.display_name.split(",")[0]}
                </p>
                <p className="text-xs text-ds-body line-clamp-1 opacity-70 mt-0.5 font-medium">
                  {r.display_name.split(",").slice(1).join(",").trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};
