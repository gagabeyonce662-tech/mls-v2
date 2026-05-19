import type { EstatePropertyRecord } from "@/lib/api/admin";
import { parseJsonObject } from "./json";

export function normalizeImageUrls(value: unknown): string[] {
  if (!value) return [];
  const raw: unknown[] = [];

  if (Array.isArray(value)) {
    raw.push(...value);
  } else if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    if (text.startsWith("[") && text.endsWith("]")) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) raw.push(...parsed);
        else raw.push(text);
      } catch {
        raw.push(...text.split(","));
      }
    } else {
      raw.push(...text.split(","));
    }
  } else {
    raw.push(value);
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  raw.forEach((item) => {
    const url = String(item ?? "").trim();
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return;
    }
    if (seen.has(url)) return;
    seen.add(url);
    deduped.push(url);
  });
  return deduped;
}

export function extractGalleryUrls(record: EstatePropertyRecord): string[] {
  const wpPost = parseJsonObject(record?.wp_post_json);
  const wpMeta = parseJsonObject(record?.wp_meta_json);

  return normalizeImageUrls([
    ...normalizeImageUrls(wpPost["images"]),
    ...normalizeImageUrls(wpPost["gallery"]),
    ...normalizeImageUrls(wpMeta["gallery_image_urls"]),
    record?.featured_image_url,
  ]);
}

export function buildCloudinaryPreviewUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  const marker = "/upload/";
  const markerIndex = raw.indexOf(marker);
  if (markerIndex === -1) return raw;
  const transformed = "f_auto,q_auto,c_fill,w_320,h_220";
  return `${raw.slice(0, markerIndex + marker.length)}${transformed}/${raw.slice(
    markerIndex + marker.length,
  )}`;
}
