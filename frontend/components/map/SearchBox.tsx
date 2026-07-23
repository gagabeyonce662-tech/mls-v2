// components/map/SearchBox.tsx
import React from "react";
import { Search, X, MapPin } from "lucide-react";

export default function SearchBox({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onClear,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ds-primary z-10 pointer-events-none ">
        <MapPin className="w-5 h-5" />
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search a city, neighbourhood, or address..."
        className="w-full pl-12 pr-12 py-4 rounded-xl border border-ds-card-border focus:ring-2 focus:ring-ds-primary focus:border-transparent outline-none bg-white shadow-sm text-ds-heading font-medium placeholder:text-ds-body/40 transition-all"
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-ds-body hover:text-ds-primary transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ds-body/30">
          <Search className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
