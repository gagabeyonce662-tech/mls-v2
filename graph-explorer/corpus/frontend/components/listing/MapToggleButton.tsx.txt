"use client";

import React from "react";
import { Map, LayoutGrid } from "lucide-react";
import { colors } from "@/config/design-system";

interface MapToggleButtonProps {
  viewMode: "grid" | "map";
  onToggle: () => void;
}

export const MapToggleButton = ({
  viewMode,
  onToggle,
}: MapToggleButtonProps) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 group border border-white/20 backdrop-blur-md"
        style={{
          backgroundColor: "#111827", // Dark slate/black for premium contrast
          color: "white",
        }}
      >
        <div className="relative w-5 h-5">
          {viewMode === "grid" ? (
            <Map className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
          ) : (
            <LayoutGrid className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
          )}
        </div>
        <span className="font-semibold text-sm tracking-wide">
          {viewMode === "grid" ? "Show Map" : "Show List"}
        </span>

        {/* Subtle glow effect */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity blur-md"
          style={{ backgroundColor: colors.primary }}
        />
      </button>
    </div>
  );
};
