"use client";

import React from "react";
import { Check } from "lucide-react";
import { colors } from "@/config/design-system";

interface StyledCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

export function StyledCheckbox({
  checked,
  onChange,
  label,
  disabled,
}: StyledCheckboxProps) {
  return (
    <label
      className={`
        group flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer
        transition-all duration-200
        hover:bg-black/[0.02]
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onChange();
      }}
    >
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          backgroundColor: checked ? colors.primary : "transparent",
          border: `2px solid ${checked ? colors.primary : colors.cardsBoarder}`,
          boxShadow: checked ? `0 2px 8px ${colors.primary}40` : "none",
        }}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <span
        className="text-[13px] transition-colors duration-200"
        style={{
          color: checked ? colors.heading : colors.body,
          fontWeight: checked ? 600 : 400,
        }}
      >
        {label}
      </span>
    </label>
  );
}
