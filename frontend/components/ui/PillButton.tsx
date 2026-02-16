"use client";

import React from "react";
import { colors } from "@/config/design-system";

interface PillButtonProps {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function PillButton({
  selected,
  onClick,
  disabled,
  children,
  fullWidth = false,
}: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-[13px] font-medium
        transition-all duration-200 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${selected ? "shadow-md scale-[1.02]" : "hover:scale-[1.01] hover:shadow-sm"}
      `}
      style={{
        backgroundColor: selected ? colors.primary : colors.cards,
        color: selected ? "#ffffff" : colors.body,
        border: `1.5px solid ${selected ? colors.primary : colors.cardsBoarder}`,
      }}
    >
      {children}
    </button>
  );
}
