"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { colors } from "@/config/design-system";

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

export function FilterSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: colors.cards,
        border: `1px solid ${colors.cardsBoarder}`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors duration-200 hover:bg-black/[0.02]"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${colors.primary}10` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: colors.primary }} />
          </div>
          <span
            className="text-[13px] font-semibold tracking-wide"
            style={{ color: colors.heading }}
          >
            {title}
          </span>
          {badge !== undefined && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-300"
          style={{
            color: colors.body,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: open ? "600px" : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <div
          className="px-4 pb-4 pt-1"
          style={{ borderTop: `1px solid ${colors.cardsBoarder}` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
