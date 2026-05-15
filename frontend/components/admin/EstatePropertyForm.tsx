"use client";

import { useEffect, useMemo, useState } from "react";
import { Editor as HugeRTEditor } from "@hugerte/hugerte-react";
import {
  uploadEstatePropertyMedia,
  type EstatePropertyRecord,
} from "@/lib/api/admin";
import LocationPicker from "@/components/admin/LocationPicker";
import "hugerte/hugerte";
import "hugerte/models/dom";
import "hugerte/themes/silver";
import "hugerte/icons/default";
import "hugerte/skins/ui/oxide/skin.js";
import "hugerte/plugins/lists";
import "hugerte/plugins/link";
import "hugerte/plugins/image";
import "hugerte/plugins/table";
import "hugerte/plugins/code";
import "hugerte/plugins/fullscreen";
import "hugerte/plugins/help";
import "hugerte/plugins/wordcount";
import "hugerte/plugins/preview";

type Column = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

interface Props {
  columns: Column[];
  initialValues?: EstatePropertyRecord;
  onSubmit: (
    payload: EstatePropertyRecord,
    options?: { stayOnPage?: boolean; isDraft?: boolean },
  ) => Promise<void>;
  submitLabel: string;
}

type DescriptionSection = {
  id: string;
  title: string;
  body_html: string;
  order: number;
};

const HIDDEN_FIELDS = new Set(["id"]);
const CORE_FIELD_ORDER = [
  "listing_key",
  "property_title",
  "property_slug",
  "property_description",
  "description_sections_json",
  "listing_url",
  "publish_status",
  "is_featured",
  "custom_tags",
  "expires_at",
  "list_price",
  "second_price",
  "enable_price_placeholder",
  "price_placeholder",
  "price_prefix",
  "after_price",
  "building_area_total",
  "size_postfix",
  "land_area",
  "land_area_size_postfix",
  "bedrooms_total",
  "rooms",
  "bathrooms_total_integer",
  "garages",
  "garage_size",
  "year_built",
  "property_id_code",
  "max_bedrooms",
  "developer",
  "occupancy_year",
  "signing_amount",
  "lot_size",
  "kitchens",
  "listing_id",
  "tax_annual_amount",
  "tax_year",
  "basement",
  "exterior_features",
  "unparsed_address",
  "city",
  "state_or_province",
  "postal_code",
  "country",
  "latitude",
  "longitude",
  "featured_image_url",
  "wp_meta_json",
  "wp_post_json",
  "wp_terms_json",
] as const;

const TAXONOMY_KEYS = [
  "type",
  "status",
  "features",
  "labels",
  "city",
  "state",
  "country",
] as const;

const TAXONOMY_OPTIONS: Record<(typeof TAXONOMY_KEYS)[number], string[]> = {
  type: [
    "Detached Homes",
    "Townhomes",
    "Bungalows",
    "Condo Apartment",
    "Pre Construction",
    "Semi-Detached",
  ],
  status: [
    "Assignments",
    "Coming Soon",
    "For Sale",
    "Leased",
    "Resale",
    "Sold Out",
  ],
  features: [
    "Appliances Included",
    "Air-conditioning Unit",
    "Finished Basement",
    "Free Assignment",
    "Free Maintenance Fees",
    "Price Discount",
  ],
  labels: [
    "$10K on Signing",
    "$20K on Signing",
    "$25K on Signing",
    "$30K on Signing",
  ],
  city: ["Brampton", "Oakville", "Ajax", "Barrie", "Milton"],
  state: ["Ontario", "California", "Florida", "Illinois", "New York"],
  country: ["Canada", "USA"],
};

const DEFAULT_DESCRIPTION_SECTION_TITLE = "Overview";
const MAX_LOCAL_MEDIA_FILES = 30;

function createSectionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `section-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeDescriptionSections(
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

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return {};
  const text = value.trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function normalizeImageUrls(value: unknown): string[] {
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

function normalizeCustomTags(value: unknown): string {
  const raw = Array.isArray(value) ? value.map(String) : String(value ?? "").split(/[,\n|]/g);
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

function extractGalleryUrls(record: EstatePropertyRecord): string[] {
  const wpPost = parseJsonObject(record?.wp_post_json);
  const wpMeta = parseJsonObject(record?.wp_meta_json);

  return normalizeImageUrls([
    ...(normalizeImageUrls(wpPost["images"]) || []),
    ...(normalizeImageUrls(wpPost["gallery"]) || []),
    ...(normalizeImageUrls(wpMeta["gallery_image_urls"]) || []),
    record?.featured_image_url,
  ]);
}

function parseNumericRange(value: unknown): { min: number; max: number } | null {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!match) return null;
  const min = Number.parseInt(match[1], 10);
  const max = Number.parseInt(match[2], 10);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
  return { min, max };
}
export default function EstatePropertyForm({
  columns,
  initialValues = {},
  onSubmit,
  submitLabel,
}: Props) {
  const [form, setForm] = useState<EstatePropertyRecord>({});
  const [isSaving, setIsSaving] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [sectionEditorModes, setSectionEditorModes] = useState<
    Record<string, "visual" | "html">
  >({});
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [summaryErrors, setSummaryErrors] = useState<string[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    setForm((prev) => {
      // 🛡️ Never overwrite if user has edited more than initialValues provided
      const initialKeys = Object.keys(initialValues || {});
      if (Object.keys(prev).length > initialKeys.length) {
        return prev; // Keep user's work
      }
      const seeded = { ...(initialValues || {}) };
      const wpMeta = parseJsonObject(seeded.wp_meta_json);
      if (seeded.max_bathrooms === undefined && wpMeta.max_bathrooms != null) {
        seeded.max_bathrooms = String(wpMeta.max_bathrooms);
      }
      if (seeded.max_garages === undefined && wpMeta.max_garages != null) {
        seeded.max_garages = String(wpMeta.max_garages);
      }
      return seeded;
    });
    setGalleryUrls(extractGalleryUrls(initialValues || {}));
    setGalleryUrlInput("");
    setPendingUploads([]);
    setMediaError("");
  }, [initialValues]); // Allow sync when switching to a DIFFERENT listing

  const editableColumns = useMemo(
    () => columns.filter((c) => !HIDDEN_FIELDS.has(c.column_name)),
    [columns],
  );
  const editableColumnNames = useMemo(
    () => new Set(editableColumns.map((c) => c.column_name)),
    [editableColumns],
  );
  const columnTypeMap = useMemo(
    () =>
      new Map(
        editableColumns.map((c) => [
          c.column_name,
          String(c.data_type || "").toLowerCase(),
        ]),
      ),
    [editableColumns],
  );
  const advancedColumns = useMemo(
    () =>
      editableColumns.filter(
        (c) =>
          !CORE_FIELD_ORDER.includes(
            c.column_name as (typeof CORE_FIELD_ORDER)[number],
          ),
      ),
    [editableColumns],
  );
  const taxonomyState = useMemo(() => {
    const raw = form.wp_terms_json;
    if (!raw) return {};
    if (typeof raw === "object" && !Array.isArray(raw))
      return raw as Record<string, unknown>;
    try {
      const parsed = JSON.parse(String(raw));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }, [form.wp_terms_json]);
  const descriptionSections = useMemo(
    () =>
      normalizeDescriptionSections(
        form.description_sections_json,
        form.property_description,
      ),
    [form.description_sections_json, form.property_description],
  );

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };
  const handleBooleanChange = (name: string, checked: boolean) => {
    setForm((prev) => ({ ...prev, [name]: checked }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };
  const setJsonField = (
    name: "wp_meta_json" | "wp_post_json" | "wp_terms_json",
    value: any,
  ) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const setDescriptionSections = (sections: DescriptionSection[]) => {
    const normalized = sections.map((section, index) => ({
      id: section.id || createSectionId(),
      title: String(section.title || ""),
      body_html: String(section.body_html || ""),
      order: index,
    }));
    setForm((prev) => ({
      ...prev,
      description_sections_json: normalized,
      property_description: normalized[0]?.body_html ?? "",
    }));
  };
  const updateDescriptionSection = (
    sectionId: string,
    field: "title" | "body_html",
    value: string,
  ) => {
    const next = descriptionSections.map((section) =>
      section.id === sectionId ? { ...section, [field]: value } : section,
    );
    setDescriptionSections(next);
  };
  const addDescriptionSection = () => {
    setDescriptionSections([
      ...descriptionSections,
      {
        id: createSectionId(),
        title: "",
        body_html: "",
        order: descriptionSections.length,
      },
    ]);
  };
  const removeDescriptionSection = (sectionId: string) => {
    setDescriptionSections(
      descriptionSections.filter((section) => section.id !== sectionId),
    );
    setSectionEditorModes((prev) => {
      if (!prev[sectionId]) return prev;
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  };
  const setSectionEditorMode = (
    sectionId: string,
    mode: "visual" | "html",
  ) => {
    setSectionEditorModes((prev) => ({ ...prev, [sectionId]: mode }));
  };
  const getSectionEditorMode = (sectionId: string): "visual" | "html" =>
    sectionEditorModes[sectionId] || "visual";
  const updateTaxonomySelection = (
    taxonomyKey: (typeof TAXONOMY_KEYS)[number],
    option: string,
  ) => {
    const current = taxonomyState[taxonomyKey];
    const selected = Array.isArray(current)
      ? current.map((x) => String(x))
      : [];
    const exists = selected.includes(option);
    const next = exists
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    setJsonField("wp_terms_json", { ...taxonomyState, [taxonomyKey]: next });
  };
  const getTaxonomySelection = (
    taxonomyKey: (typeof TAXONOMY_KEYS)[number],
  ) => {
    const current = taxonomyState[taxonomyKey];
    return Array.isArray(current) ? current.map((x) => String(x)) : [];
  };

  const addGalleryUrl = () => {
    const candidate = galleryUrlInput.trim();
    setMediaError("");
    if (!candidate) return;

    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setMediaError("Image URL must start with http:// or https://");
        return;
      }
    } catch {
      setMediaError("Please enter a valid image URL.");
      return;
    }

    setGalleryUrls((prev) => normalizeImageUrls([...prev, candidate]));
    setGalleryUrlInput("");
  };

  const removeGalleryUrl = (index: number) => {
    setGalleryUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveGalleryUrl = (index: number, direction: -1 | 1) => {
    setGalleryUrls((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const handleLocalUploads = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMediaError("");
    const next = [...pendingUploads, ...Array.from(files)];
    if (next.length > MAX_LOCAL_MEDIA_FILES) {
      setMediaError(
        `You can queue up to ${MAX_LOCAL_MEDIA_FILES} images per save.`,
      );
      setPendingUploads(next.slice(0, MAX_LOCAL_MEDIA_FILES));
      return;
    }
    setPendingUploads(next);
  };

  const removePendingUpload = (index: number) => {
    setPendingUploads((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submitWithValidation = async (
    payload: EstatePropertyRecord,
    options?: { stayOnPage?: boolean; isDraft?: boolean },
  ) => {
    setSubmitError("");
    const nextFieldErrors: Record<string, string> = {};
    const nextSummaryErrors: string[] = [];
    const listingKey = String(payload.listing_key ?? "").trim();
    if (!listingKey) {
      nextFieldErrors.listing_key = "Listing key is required.";
      nextSummaryErrors.push("listing_key is required.");
    }
    if (nextSummaryErrors.length > 0) {
      setFieldErrors(nextFieldErrors);
      setSummaryErrors(nextSummaryErrors);
      return;
    }
    setFieldErrors({});
    setSummaryErrors([]);

    setIsSaving(true);
    let uploadedUrls: string[] = [];
    if (pendingUploads.length > 0) {
      setIsUploadingMedia(true);
      try {
        const uploaded = await uploadEstatePropertyMedia(pendingUploads);
        uploadedUrls = normalizeImageUrls(uploaded.map((item) => item.url));
      } catch (err: any) {
        setSubmitError(err?.message || "Unable to upload images.");
        setIsSaving(false);
        setIsUploadingMedia(false);
        return;
      } finally {
        setIsUploadingMedia(false);
      }
    }

    // Put newly uploaded media first so users immediately see the latest upload
    // as the featured image unless they reorder manually.
    const finalGalleryUrls = normalizeImageUrls([...uploadedUrls, ...galleryUrls]);
    const normalizedPayload: EstatePropertyRecord = { ...payload };
    normalizedPayload.custom_tags = normalizeCustomTags(normalizedPayload.custom_tags);
    if (normalizedPayload.custom_tags === "") {
      normalizedPayload.custom_tags = null;
    }
    const normalizedSections = normalizeDescriptionSections(
      normalizedPayload.description_sections_json,
      normalizedPayload.property_description,
    );
    if (normalizedSections.length > 0 || normalizedPayload.description_sections_json) {
      normalizedPayload.description_sections_json = normalizedSections.map(
        (section, index) => ({
          id: section.id || createSectionId(),
          title: String(section.title || ""),
          body_html: String(section.body_html || ""),
          order: index,
        }),
      );
      normalizedPayload.property_description =
        normalizedPayload.description_sections_json[0]?.body_html ?? "";
    }
    const existingWpPost = parseJsonObject(normalizedPayload.wp_post_json);
    const existingWpMeta = parseJsonObject(normalizedPayload.wp_meta_json);
    normalizedPayload.wp_post_json = {
      ...existingWpPost,
      images: finalGalleryUrls,
      gallery: finalGalleryUrls,
    };
    normalizedPayload.wp_meta_json = {
      ...existingWpMeta,
      gallery_image_urls: finalGalleryUrls,
    };
    normalizedPayload.featured_image_url = finalGalleryUrls[0] ?? "";

    // Allow admin shorthand like "3-5" in bedrooms_total by splitting into
    // min bedrooms + max_bedrooms (when schema supports max_bedrooms).
    const bedroomRange = parseNumericRange(normalizedPayload.bedrooms_total);
    if (bedroomRange) {
      normalizedPayload.bedrooms_total = bedroomRange.min;
      if (editableColumnNames.has("max_bedrooms")) {
        normalizedPayload.max_bedrooms = bedroomRange.max;
      }
    }

    // Bathrooms range support via virtual max_bathrooms field + wp_meta_json fallback.
    const bathroomRange = parseNumericRange(normalizedPayload.bathrooms_total_integer);
    const explicitMaxBathrooms = Number.parseInt(
      String(normalizedPayload.max_bathrooms ?? "").trim(),
      10,
    );
    if (bathroomRange) {
      normalizedPayload.bathrooms_total_integer = bathroomRange.min;
      normalizedPayload.wp_meta_json = {
        ...parseJsonObject(normalizedPayload.wp_meta_json),
        max_bathrooms: bathroomRange.max,
      };
    } else if (Number.isFinite(explicitMaxBathrooms) && explicitMaxBathrooms > 0) {
      normalizedPayload.wp_meta_json = {
        ...parseJsonObject(normalizedPayload.wp_meta_json),
        max_bathrooms: explicitMaxBathrooms,
      };
    }

    // Garages range support via virtual max_garages field + wp_meta_json fallback.
    const garageRange = parseNumericRange(normalizedPayload.garages);
    const explicitMaxGarages = Number.parseInt(
      String(normalizedPayload.max_garages ?? "").trim(),
      10,
    );
    if (garageRange) {
      normalizedPayload.garages = garageRange.min;
      normalizedPayload.wp_meta_json = {
        ...parseJsonObject(normalizedPayload.wp_meta_json),
        max_garages: garageRange.max,
      };
    } else if (Number.isFinite(explicitMaxGarages) && explicitMaxGarages > 0) {
      normalizedPayload.wp_meta_json = {
        ...parseJsonObject(normalizedPayload.wp_meta_json),
        max_garages: explicitMaxGarages,
      };
    }

    delete normalizedPayload.max_bathrooms;
    delete normalizedPayload.max_garages;

    delete normalizedPayload.id;
    for (const [field, rawValue] of Object.entries(normalizedPayload)) {
      const dataType = columnTypeMap.get(field) || "";
      let value: any = rawValue;
      if (Array.isArray(value) && !["json", "jsonb"].includes(dataType)) {
        value = value.length > 0 ? value[0] : null;
      }
      if (
        (dataType.includes("int") ||
          dataType.includes("numeric") ||
          dataType.includes("double") ||
          dataType.includes("real")) &&
        value === ""
      ) {
        value = null;
      }
      if (dataType.includes("int") && value != null) {
        const parsed = Number.parseInt(String(value), 10);
        value = Number.isFinite(parsed) ? parsed : null;
      } else if (
        (dataType.includes("numeric") ||
          dataType.includes("double") ||
          dataType.includes("real")) &&
        value != null
      ) {
        const parsed = Number.parseFloat(String(value));
        value = Number.isFinite(parsed) ? parsed : null;
      } else if (dataType === "boolean" && value != null) {
        if (typeof value === "string") {
          const lowered = value.trim().toLowerCase();
          value = ["1", "true", "yes", "y", "on"].includes(lowered);
        } else {
          value = Boolean(value);
        }
      } else if ((dataType === "json" || dataType === "jsonb") && typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
          value = {};
        } else {
          try {
            value = JSON.parse(trimmed);
          } catch {
            value = {};
          }
        }
      } else if (
        (dataType.includes("timestamp") || dataType.includes("date")) &&
        value === ""
      ) {
        value = null;
      }
      normalizedPayload[field] = value;
    }
    if (normalizedPayload.is_featured === undefined || normalizedPayload.is_featured === null) {
      normalizedPayload.is_featured = false;
    }
    try {
      await onSubmit(normalizedPayload, options);
      if (uploadedUrls.length > 0) {
        setGalleryUrls(finalGalleryUrls);
        setPendingUploads([]);
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Unable to save estate property.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitWithValidation(form, { stayOnPage: false, isDraft: false });
  };

  const handleSaveDraft = async () => {
    const draftPayload: EstatePropertyRecord = {
      ...form,
      publish_status: "draft",
    };
    setForm(draftPayload);
    await submitWithValidation(draftPayload, {
      stayOnPage: true,
      isDraft: true,
    });
  };

  const applyJsonPayload = () => {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError("JSON must be a single object.");
        return;
      }

      const allowedFields = new Set(editableColumns.map((c) => c.column_name));
      const entries = Object.entries(parsed);
      const filtered = Object.fromEntries(
        entries.filter(([k]) => allowedFields.has(k)),
      );
      const unmatched = Object.fromEntries(
        entries.filter(([k]) => !allowedFields.has(k)),
      );

      setForm((prev) => {
        const next = { ...prev, ...filtered };
        const nextTerms =
          typeof next.wp_terms_json === "object" && next.wp_terms_json !== null
            ? { ...next.wp_terms_json }
            : {};
        const nextPost =
          typeof next.wp_post_json === "object" && next.wp_post_json !== null
            ? { ...next.wp_post_json }
            : {};

        for (const [k, v] of Object.entries(unmatched)) {
          if (
            k.startsWith("taxonomy_") ||
            TAXONOMY_KEYS.includes(k as (typeof TAXONOMY_KEYS)[number])
          ) {
            const normalized = k.startsWith("taxonomy_")
              ? k.replace("taxonomy_", "")
              : k;
            nextTerms[normalized] = Array.isArray(v) ? v : [String(v)];
          } else if (k.startsWith("post_")) {
            nextPost[k] = v;
          }
        }
        if (
          Object.keys(nextTerms).length > 0 &&
          allowedFields.has("wp_terms_json")
        ) {
          next.wp_terms_json = nextTerms;
        }
        if (
          Object.keys(nextPost).length > 0 &&
          allowedFields.has("wp_post_json")
        ) {
          next.wp_post_json = nextPost;
        }

        if (
          allowedFields.has("wp_meta_json") &&
          Object.keys(unmatched).length > 0
        ) {
          const currentMeta =
            typeof next.wp_meta_json === "object" && next.wp_meta_json !== null
              ? next.wp_meta_json
              : {};
          const safeMeta = Object.fromEntries(
            Object.entries(unmatched).filter(
              ([k]) =>
                !k.startsWith("taxonomy_") &&
                !k.startsWith("post_") &&
                !TAXONOMY_KEYS.includes(k as (typeof TAXONOMY_KEYS)[number]),
            ),
          );
          next.wp_meta_json = { ...currentMeta, ...safeMeta };
        }
        return next;
      });
      const parsedGallery = extractGalleryUrls(parsed as EstatePropertyRecord);
      if (parsedGallery.length > 0) {
        setGalleryUrls(parsedGallery);
      }
    } catch {
      setJsonError("Invalid JSON format.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <h2 className="text-base font-semibold">Paste JSON</h2>
        <p className="text-xs text-gray-500">
          Paste one listing JSON object to auto-fill matching fields.
        </p>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={8}
          placeholder='{"listing_key":"EST-1001","unparsed_address":"123 Main St","city":"Toronto","list_price":950000}'
          className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={applyJsonPayload}
            className="px-3 py-2 rounded-lg border text-sm font-medium"
          >
            Apply JSON
          </button>
          {jsonError ? (
            <span className="text-xs text-red-600">{jsonError}</span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border rounded-xl p-4 space-y-3">
            <h2 className="text-lg font-semibold">Information</h2>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-gray-600">
                listing_key *
              </span>
              <input
                value={String(form.listing_key ?? "")}
                onChange={(e) => handleChange("listing_key", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {fieldErrors.listing_key ? (
                <span className="text-xs text-red-600">
                  {fieldErrors.listing_key}
                </span>
              ) : null}
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-gray-600">
                property_title *
              </span>
              <input
                value={String(form.property_title ?? "")}
                onChange={(e) => handleChange("property_title", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-gray-600">
                property_slug *
              </span>
              <input
                value={String(form.property_slug ?? "")}
                onChange={(e) => handleChange("property_slug", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <p className="text-xs text-gray-500">
              Permalink:{" "}
              {String(
                form.listing_url || "/estate/" + (form.property_slug || ""),
              )}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">
                  description_sections
                </span>
                <button
                  type="button"
                  onClick={addDescriptionSection}
                  className="px-2 py-1 text-xs rounded border"
                >
                  Add Section
                </button>
              </div>
              {descriptionSections.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                  No sections yet. Add one to start building the listing narrative.
                </div>
              ) : null}
              {descriptionSections.map((section, index) => {
                const mode = getSectionEditorMode(section.id);
                return (
                  <div
                    key={section.id || `section-${index}`}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-600">
                        Section {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex gap-1 rounded border p-1">
                          <button
                            type="button"
                            className={`px-2 py-1 text-xs rounded ${mode === "visual" ? "bg-gray-100" : ""}`}
                            onClick={() => setSectionEditorMode(section.id, "visual")}
                          >
                            Visual
                          </button>
                          <button
                            type="button"
                            className={`px-2 py-1 text-xs rounded ${mode === "html" ? "bg-gray-100" : ""}`}
                            onClick={() => setSectionEditorMode(section.id, "html")}
                          >
                            HTML
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDescriptionSection(section.id)}
                          className="px-2 py-1 text-xs rounded border text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <label className="space-y-1 block">
                      <span className="text-xs font-semibold text-gray-600">title</span>
                      <input
                        value={section.title}
                        onChange={(e) =>
                          updateDescriptionSection(section.id, "title", e.target.value)
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        placeholder={DEFAULT_DESCRIPTION_SECTION_TITLE}
                      />
                    </label>
                    {mode === "visual" ? (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <HugeRTEditor
                          value={section.body_html}
                          init={{
                            height: 320,
                            menubar: true,
                            plugins: [
                              "lists",
                              "link",
                              "image",
                              "table",
                              "code",
                              "fullscreen",
                              "help",
                              "wordcount",
                              "preview",
                            ],
                            toolbar: `
                              undo redo | formatselect |
                              bold italic underline strikethrough |
                              forecolor backcolor |
                              alignleft aligncenter alignright alignjustify |
                              bullist numlist outdent indent |
                              removeformat | link image table | code fullscreen
                            `,
                            skin: "oxide",
                            content_css: "default",
                            branding: false,
                          }}
                          onEditorChange={(content: string) =>
                            updateDescriptionSection(section.id, "body_html", content)
                          }
                        />
                      </div>
                    ) : (
                      <textarea
                        rows={10}
                        value={section.body_html}
                        onChange={(e) =>
                          updateDescriptionSection(section.id, "body_html", e.target.value)
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                        placeholder="<p>Enter formatted HTML content...</p>"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Property Settings</h2>
            {editableColumnNames.has("latitude") &&
            editableColumnNames.has("longitude") ? (
              <div className="mb-4">
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  address={String(form.unparsed_address ?? "")}
                  onCoordinatesChange={(nextLat, nextLng) => {
                    handleChange("latitude", nextLat);
                    handleChange("longitude", nextLng);
                  }}
                  onAddressChange={(nextAddress) =>
                    handleChange("unparsed_address", nextAddress)
                  }
                />
              </div>
            ) : null}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">
                  max_bathrooms (range upper bound)
                </span>
                <input
                  value={String(form.max_bathrooms ?? "")}
                  onChange={(e) => handleChange("max_bathrooms", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="e.g. 4"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">
                  max_garages (range upper bound)
                </span>
                <input
                  value={String(form.max_garages ?? "")}
                  onChange={(e) => handleChange("max_garages", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="e.g. 3"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "list_price",
                "second_price",
                "enable_price_placeholder",
                "price_placeholder",
                "price_prefix",
                "after_price",
                "building_area_total",
                "size_postfix",
                "land_area",
                "land_area_size_postfix",
                "bedrooms_total",
                "rooms",
                "bathrooms_total_integer",
                "garages",
                "garage_size",
                "year_built",
                "property_id_code",
                "max_bedrooms",
                "developer",
                "occupancy_year",
                "signing_amount",
                "lot_size",
                "kitchens",
                "listing_id",
                "tax_annual_amount",
                "tax_year",
                "basement",
                "exterior_features",
                "unparsed_address",
                "city",
                "state_or_province",
                "postal_code",
                "country",
              ]
                .filter((key) => editableColumnNames.has(key))
                .map((key) => (
                  <label key={key} className="space-y-1">
                    <span className="text-xs font-semibold text-gray-600">
                      {key}
                    </span>
                    {key === "enable_price_placeholder" ? (
                      <select
                        value={String(form[key] ?? "false")}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    ) : (
                      <input
                        value={String(form[key] ?? "")}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    )}
                  </label>
                ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Taxonomies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TAXONOMY_KEYS.map((key) => (
                <div key={key} className="rounded-lg border p-3">
                  <div className="font-medium text-sm mb-2 capitalize">
                    {key}
                  </div>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {TAXONOMY_OPTIONS[key].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={getTaxonomySelection(key).includes(option)}
                          onChange={() => updateTaxonomySelection(key, option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 space-y-3">
            <h2 className="text-lg font-semibold">Advanced Fields</h2>
            <p className="text-xs text-gray-500">
              Remaining schema-backed fields are available here for full
              compatibility.
            </p>
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                Show {advancedColumns.length} additional fields
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {advancedColumns.map((col) => (
                  <label key={col.column_name} className="space-y-1">
                    <span className="text-xs font-semibold text-gray-600">
                      {col.column_name}
                    </span>
                    <input
                      value={String(form[col.column_name] ?? "")}
                      onChange={(e) =>
                        handleChange(col.column_name, e.target.value)
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4 space-y-3">
            <h2 className="text-base font-semibold">Publish</h2>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-gray-600">
                publish_status *
              </span>
              <select
                value={String(form.publish_status || "draft")}
                onChange={(e) => handleChange("publish_status", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="private">private</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-gray-600">
                expires_at
              </span>
              <input
                type="datetime-local"
                value={String(form.expires_at ?? "")}
                onChange={(e) => handleChange("expires_at", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            {editableColumnNames.has("is_featured") ? (
              <label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_featured)}
                  onChange={(e) =>
                    handleBooleanChange("is_featured", e.target.checked)
                  }
                />
                <span className="text-sm font-semibold text-amber-800">
                  Featured Tag
                </span>
              </label>
            ) : null}
            {editableColumnNames.has("custom_tags") ? (
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-gray-600">
                  custom_tags
                </span>
                <input
                  value={String(form.custom_tags ?? "")}
                  onChange={(e) =>
                    handleChange("custom_tags", normalizeCustomTags(e.target.value))
                  }
                  placeholder="Luxury, Waterfront, Corner Lot"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <span className="text-[11px] text-gray-500">
                  Comma-separated tags. “Featured” is controlled by the checkbox above.
                </span>
              </label>
            ) : null}
          </div>

          <div className="bg-white border rounded-xl p-4 space-y-3">
            <h2 className="text-base font-semibold">Media</h2>
            <p className="text-xs text-gray-500">
              Add images by URL or upload. Uploaded files are stored through the
              backend storage (Cloudinary when configured). The first image is
              used as <code>featured_image_url</code>.
            </p>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-600">
                Add image URL
              </span>
              <div className="flex items-center gap-2">
                <input
                  value={galleryUrlInput}
                  onChange={(e) => setGalleryUrlInput(e.target.value)}
                  placeholder="https://example.com/property-photo.jpg"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addGalleryUrl}
                  className="px-3 py-2 rounded-lg border text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-600">
                Upload images
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleLocalUploads(e.target.files)}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
              />
              {pendingUploads.length > 0 ? (
                <div className="rounded-lg border p-2 space-y-1">
                  <p className="text-xs font-semibold text-gray-600">
                    Pending upload ({pendingUploads.length})
                  </p>
                  <ul className="space-y-1">
                    {pendingUploads.map((file, idx) => (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate">
                          {file.name} ({Math.max(1, Math.round(file.size / 1024))}KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingUpload(idx)}
                          className="px-2 py-1 rounded border"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-600">
                Final gallery order ({galleryUrls.length + pendingUploads.length})
              </span>
              {galleryUrls.length > 0 ? (
                <ul className="space-y-2">
                  {galleryUrls.map((url, idx) => (
                    <li key={`${url}-${idx}`} className="rounded-lg border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-600">
                          {idx + 1}. {idx === 0 ? "Featured image" : "Gallery image"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveGalleryUrl(idx, -1)}
                            disabled={idx === 0}
                            className="px-2 py-1 rounded border text-xs disabled:opacity-40"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGalleryUrl(idx, 1)}
                            disabled={idx === galleryUrls.length - 1}
                            className="px-2 py-1 rounded border text-xs disabled:opacity-40"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGalleryUrl(idx)}
                            className="px-2 py-1 rounded border text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-700 break-all">{url}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-xs text-gray-500">
                  No URL images added yet.
                </div>
              )}
            </div>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-gray-600">
                video_url
              </span>
              <input
                value={String((form.wp_meta_json?.video_url as string) ?? "")}
                onChange={(e) =>
                  setJsonField("wp_meta_json", {
                    ...(typeof form.wp_meta_json === "object" &&
                      form.wp_meta_json
                      ? form.wp_meta_json
                      : {}),
                    video_url: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            {mediaError ? (
              <p className="text-xs text-red-600">{mediaError}</p>
            ) : null}
          </div>
        </div>
      </div>

      {summaryErrors.length > 0 ? (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="font-medium">Please fix the following:</p>
          <ul className="list-disc ml-5">
            {summaryErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {submitError ? (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {submitError}
        </div>
      ) : null}

      <div className="sticky bottom-4 bg-white border rounded-xl p-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60"
        >
          {isSaving ? (isUploadingMedia ? "Uploading..." : "Saving...") : "Save Draft"}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {isSaving ? (isUploadingMedia ? "Uploading..." : "Saving...") : submitLabel}
        </button>
      </div>
    </form>
  );
}
