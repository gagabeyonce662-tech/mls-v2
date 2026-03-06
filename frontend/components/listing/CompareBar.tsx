import React from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { colors } from "@/config/design-system";
import { usePathname } from "next/navigation";
import { useCompare } from "@/contexts/CompareContext";

export const CompareBar = () => {
  const { compareList, removeFromCompare, getPropertyKey } = useCompare();
  const pathname = usePathname();

  if (compareList.length === 0 || pathname.startsWith("/compare")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-md border-t shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-all animate-slideUp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
          <div className="text-sm font-bold text-ds-heading whitespace-nowrap hidden md:block">
            Comparing ({compareList.length}/5):
          </div>
          <div className="flex items-center gap-2">
            {compareList.map((property) => (
              <div
                key={getPropertyKey(property)}
                className="flex items-center gap-2 bg-ds-card border border-ds-card-border px-3 py-1.5 rounded-full text-xs font-medium text-ds-heading shadow-sm truncate max-w-[150px] animate-fadeIn"
              >
                <span className="truncate">
                  {property.city || property.City || "Property"}
                </span>
                <button
                  onClick={() => removeFromCompare(getPropertyKey(property))}
                  className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                  aria-label="Remove property"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/compare?ids=${compareList
              .map((p) => getPropertyKey(p))
              .join(",")}`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-ds-primary/20"
            style={{ backgroundColor: colors.primary, color: colors.cards }}
          >
            Compare Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            scale: 0.95;
          }
          to {
            opacity: 1;
            scale: 1;
          }
        }
      `}</style>
    </div>
  );
};
