// src/hooks/useListings.ts
import { useMemo } from 'react';
import type { ListingItem } from '../data/listings';
import { LISTINGS } from '../data/listings';

export function useListings(): ListingItem[] {
  // useMemo keeps a stable reference (handy forPerf or prop deps)
  return useMemo(() => LISTINGS, []);
}
