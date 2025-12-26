// components/SearchBox.tsx
import React from "react";

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
    <div className="mb-4 flex items-center gap-4 justify-center">
      <div className="relative w-96">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search for a location..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white shadow-sm"
          autoComplete="off"
        />
        {value && (
          <button type="button" onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>
    </div>
  );
}
