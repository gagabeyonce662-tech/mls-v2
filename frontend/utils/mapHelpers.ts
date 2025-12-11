// utils/mapHelpers.ts
import { PropertyMarker } from "@/types/property";

export const formatPrice = (price: string | number | undefined) => {
  if (!price) return "Price not available";
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return String(price);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
};

export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) => {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const openStreetView = (lat: number, lng: number, title?: string) => {
  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const streetViewWindow = window.open(url, "_blank");
  if (streetViewWindow) {
    streetViewWindow.focus();
  } else {
    alert("Please allow popups for this site to open Street View");
  }
};