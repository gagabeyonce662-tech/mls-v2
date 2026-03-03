"use client";

import React from "react";
import PropertyFilter from "@/components/PropertyFilter";
import { colors } from "@/config/design-system";
import { type Property } from "@/lib/api";

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onPropertiesUpdate: (props: Property[], q?: string) => void;
}

export default function MobileFilterDrawer({
  open,
  onClose,
  onPropertiesUpdate,
}: MobileFilterDrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition-transform duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ borderLeft: `1px solid ${colors.boarder}` }}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-base font-medium">Filters</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded-md">
            Close
          </button>
        </div>
        <div
          className="p-3 overflow-y-auto h-[calc(100%-60px)]"
          style={{ overscrollBehavior: "contain" }}
        >
          <PropertyFilter onPropertiesUpdate={onPropertiesUpdate} />
        </div>
      </aside>
    </div>
  );
}
