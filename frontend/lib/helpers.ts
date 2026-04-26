// lib/helpers.ts
import { env } from "./env";

export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300,
) {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const formatPrice = (price: string | number | undefined) => {
  if (price === undefined || price === null || price === "")
    return "Price not available";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(numPrice)) return String(price);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
};

export async function fetchExclusivePropertiesForBBox(bbox: {
  latitude_min: number;
  latitude_max: number;
  longitude_min: number;
  longitude_max: number;
}) {
  const params = new URLSearchParams();
  params.append("lat_min", String(bbox.latitude_min));
  params.append("lat_max", String(bbox.latitude_max));
  params.append("lng_min", String(bbox.longitude_min));
  params.append("lng_max", String(bbox.longitude_max));
  params.append("limit", "100");
  params.append("offset", "0");
  const url = `${API_BASE_URL}/api/mls/properties/filter/?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Filter API error ${res.status}: ${txt}`);
  }
  return res.json();
}

export const openStreetView = (lat: number, lng: number) => {
  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const w = window.open(url, "_blank");
  if (w) w.focus();
  else alert("Please allow popups for this site to open Street View");
};
