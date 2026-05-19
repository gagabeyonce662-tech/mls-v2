import type { EstatePropertyRecord } from "@/lib/api/admin";
import {
  DEFAULT_DESCRIPTION_SECTION_TITLE,
} from "../constants";
import type {
  DescriptionSection,
  EditableDetailBlock,
  EditableListingButton,
} from "../types";
import { createSectionId } from "./ids";
import { parseJsonArray, parseJsonObject } from "./json";

export function normalizeDescriptionSections(
  raw: unknown,
  legacyDescription: unknown,
): DescriptionSection[] {
  const asArray = Array.isArray(raw) ? raw : [];
  const normalized = asArray
    .map((item, idx): DescriptionSection | null => {
      if (!item || typeof item !== "object") return null;
      const typed = item as Record<string, unknown>;
      return {
        id: String(typed.id || `section-${idx + 1}`),
        title: String(typed.title || ""),
        body_html: String(typed.body_html || ""),
        order:
          typeof typed.order === "number"
            ? typed.order
            : Number.parseInt(String(typed.order ?? idx), 10) || idx,
      };
    })
    .filter((item): item is DescriptionSection => item !== null)
    .sort((a, b) => a.order - b.order);

  if (normalized.length > 0) return normalized;

  const legacy = String(legacyDescription ?? "").trim();
  if (!legacy) return [];

  return [
    {
      id: "legacy-overview",
      title: DEFAULT_DESCRIPTION_SECTION_TITLE,
      body_html: legacy,
      order: 0,
    },
  ];
}

export function readRecordJsonField(
  record: EstatePropertyRecord,
  fieldName: string,
): unknown {
  if (record[fieldName] !== undefined && record[fieldName] !== null) {
    return record[fieldName];
  }
  return parseJsonObject(record.wp_meta_json)[fieldName];
}

export function normalizeEditableDetailBlocks(
  value: unknown,
): EditableDetailBlock[] {
  return parseJsonArray(value).map((block, index) => {
    const typed =
      block && typeof block === "object"
        ? (block as Record<string, unknown>)
        : {};
    const items = parseJsonArray(typed.items).map((item) => {
      const row =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        label: String(row.label || ""),
        value: String(row.value || ""),
      };
    });
    return {
      id: String(typed.id || `custom_${createSectionId()}`),
      title: String(typed.title || ""),
      order:
        typeof typed.order === "number"
          ? typed.order
          : Number.parseInt(String(typed.order ?? index), 10) || index,
      items: items.length > 0 ? items : [{ label: "", value: "" }],
    };
  });
}

export function normalizeEditableListingButtons(
  value: unknown,
): EditableListingButton[] {
  return parseJsonArray(value).map((button, index) => {
    const typed =
      button && typeof button === "object"
        ? (button as Record<string, unknown>)
        : {};
    const requiresPhoneVerification =
      typeof typed.requires_phone_verification === "boolean"
        ? typed.requires_phone_verification
        : ["1", "true", "yes", "y", "on"].includes(
            String(typed.requires_phone_verification ?? "")
              .trim()
              .toLowerCase(),
          );
    return {
      id: String(typed.id || `listing_button_${createSectionId()}`),
      label: String(typed.label || ""),
      href: String(typed.href || ""),
      order:
        typeof typed.order === "number"
          ? typed.order
          : Number.parseInt(String(typed.order ?? index), 10) || index,
      requiresPhoneVerification,
    };
  });
}

export function normalizeCustomTags(value: unknown): string {
  const raw = Array.isArray(value)
    ? value.map(String)
    : String(value ?? "").split(/[,\n|]/g);
  const cleaned = raw
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((item) => item.toLowerCase() !== "featured");
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const tag of cleaned) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(tag);
  }
  return deduped.join(", ");
}

export function parseNumericRange(
  value: unknown,
): { min: number; max: number } | null {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!match) return null;
  const min = Number.parseInt(match[1], 10);
  const max = Number.parseInt(match[2], 10);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
  return { min, max };
}
