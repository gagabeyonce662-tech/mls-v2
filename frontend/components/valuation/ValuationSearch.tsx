"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { colors } from "@/config/design-system";
import {
  getValuationAutocomplete,
  getValuationLookup,
  type ValuationAutocompleteItem,
  type ValuationLookupPayload,
} from "@/lib/api/valuation";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onLookupResolved: (payload: ValuationLookupPayload) => void;
  onBusyChange?: (busy: boolean) => void;
};

export function ValuationSearch({
  value,
  onChange,
  onLookupResolved,
  onBusyChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ValuationAutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const runAutocomplete = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    onBusyChange?.(true);
    try {
      const res = await getValuationAutocomplete(q.trim());
      setItems(res.results);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  }, [onBusyChange]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runAutocomplete(value);
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runAutocomplete]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const pick = async (it: ValuationAutocompleteItem) => {
    setOpen(false);
    onChange(it.label);
    setLoading(true);
    onBusyChange?.(true);
    try {
      const payload = await getValuationLookup({ listing_key: it.listing_key });
      onLookupResolved(payload);
    } catch {
      try {
        const payload = await getValuationLookup({ address: it.label });
        onLookupResolved(payload);
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  };

  const submitAddress = async () => {
    const q = value.trim();
    if (q.length < 3) return;
    setLoading(true);
    onBusyChange?.(true);
    try {
      const payload = await getValuationLookup({ address: q });
      onLookupResolved(payload);
    } catch {
      /* not found */
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  };

  return (
    <div ref={wrapRef} className="max-w-2xl w-full relative">
      <div
        className="flex items-stretch rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <div className="flex-1 flex items-center gap-3 px-5">
          <MapPin
            className="w-5 h-5 flex-shrink-0"
            style={{ color: colors.body }}
          />
          <input
            type="text"
            placeholder="Address, street, or MLS listing #..."
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="w-full py-4.5 focus:outline-none text-base bg-transparent"
            style={{ color: colors.heading }}
          />
        </div>
        <button
          type="button"
          onClick={() => submitAddress()}
          disabled={loading}
          className="px-8 py-4 font-semibold flex items-center gap-2 transition-all hover:opacity-90 hover:shadow-lg relative overflow-hidden group disabled:opacity-60"
          style={{ backgroundColor: colors.icon, color: "#fff" }}
        >
          <Search className="w-5 h-5 relative z-10" />
          <span className="hidden sm:inline relative z-10">Get estimate</span>
        </button>
      </div>

      {open && items.length > 0 && (
        <ul
          className="absolute z-20 left-0 right-0 mt-2 rounded-xl border shadow-xl max-h-64 overflow-auto"
          style={{
            backgroundColor: "#fff",
            borderColor: colors.cardsBoarder,
          }}
        >
          {items.map((it) => (
            <li key={it.listing_key}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 text-sm hover:bg-black/[0.04]"
                style={{ color: colors.heading }}
                onClick={() => pick(it)}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
