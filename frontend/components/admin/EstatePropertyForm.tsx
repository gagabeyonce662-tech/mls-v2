"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Editor as HugeRTEditor } from "@hugerte/hugerte-react";
import {
  fetchEstateCloudinaryAssets,
  uploadEstatePropertyMedia,
  type EstatePropertyCloudinaryAsset,
  type EstatePropertyRecord,
} from "@/lib/api/admin";
import {
  getDefaultPropertyDetailBlockLayout,
  normalizeListingActionButtons,
  normalizePropertyCustomDetailBlocks,
  normalizePropertyDetailBlockLayout,
  type PropertyDetailBlockLayoutItem,
} from "@/lib/propertyUtils";
import LocationPicker from "@/components/admin/LocationPicker";
import { CloudinaryPickerDialog } from "@/components/admin/estate-property-form/CloudinaryPickerDialog";
import { JsonImportSection } from "@/components/admin/estate-property-form/sections/JsonImportSection";
import { MediaSection } from "@/components/admin/estate-property-form/sections/MediaSection";
import { SubmitBar } from "@/components/admin/estate-property-form/sections/SubmitBar";
import {
  ADMIN_FIELD_LABELS,
  CLOUDINARY_PICK_PAGE_SIZE,
  CORE_FIELD_ORDER,
  DEFAULT_DESCRIPTION_SECTION_TITLE,
  DEFAULT_DETAIL_BLOCK_TITLES,
  HIDDEN_FIELDS,
  MAX_LOCAL_MEDIA_FILES,
  TAXONOMY_KEYS,
  TAXONOMY_OPTIONS,
} from "@/components/admin/estate-property-form/constants";
import type {
  DescriptionSection,
  EditableDetailBlock,
  EditableListingButton,
  EstatePropertyFormProps,
} from "@/components/admin/estate-property-form/types";
import { moveItem } from "@/components/admin/estate-property-form/utils/array";
import { createSectionId } from "@/components/admin/estate-property-form/utils/ids";
import { parseJsonObject } from "@/components/admin/estate-property-form/utils/json";
import {
  extractGalleryUrls,
  normalizeImageUrls,
} from "@/components/admin/estate-property-form/utils/media";
import {
  normalizeCustomTags,
  normalizeDescriptionSections,
  normalizeEditableDetailBlocks,
  normalizeEditableListingButtons,
  parseNumericRange,
  readRecordJsonField,
} from "@/components/admin/estate-property-form/utils/normalization";
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

export default function EstatePropertyForm({
  columns,
  initialValues = {},
  onSubmit,
  submitLabel,
}: EstatePropertyFormProps) {
  const [form, setForm] = useState<EstatePropertyRecord>({});
  const [isSaving, setIsSaving] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [sectionEditorModes, setSectionEditorModes] = useState<
    Record<string, "visual" | "html">
  >({});
  const [pendingSectionTitleFocusId, setPendingSectionTitleFocusId] = useState<
    string | null
  >(null);
  const sectionTitleRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [summaryErrors, setSummaryErrors] = useState<string[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isCloudinaryPickerOpen, setIsCloudinaryPickerOpen] = useState(false);
  const [cloudinaryAssets, setCloudinaryAssets] = useState<
    EstatePropertyCloudinaryAsset[]
  >([]);
  const [cloudinaryNextCursor, setCloudinaryNextCursor] = useState<string | null>(
    null,
  );
  const [cloudinaryPageIndex, setCloudinaryPageIndex] = useState(0);
  const [cloudinaryPageCursors, setCloudinaryPageCursors] = useState<(string | null)[]>(
    [null],
  );
  const [cloudinaryLoading, setCloudinaryLoading] = useState(false);
  const [cloudinaryError, setCloudinaryError] = useState("");
  const [cloudinaryPrefixInput, setCloudinaryPrefixInput] = useState("");
  const [cloudinaryResolvedPrefix, setCloudinaryResolvedPrefix] = useState("");
  const [selectedCloudinaryUrls, setSelectedCloudinaryUrls] = useState<string[]>(
    [],
  );
  const pendingUploadPreviews = useMemo(
    () =>
      pendingUploads.map((file, idx) => ({
        file,
        key: `${file.name}-${idx}`,
        previewUrl: URL.createObjectURL(file),
      })),
    [pendingUploads],
  );

  useEffect(
    () => () => {
      pendingUploadPreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [pendingUploadPreviews],
  );

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
  useEffect(() => {
    if (!pendingSectionTitleFocusId) return;
    const titleInput = sectionTitleRefs.current[pendingSectionTitleFocusId];
    if (!titleInput) return;
    titleInput.focus();
    setPendingSectionTitleFocusId(null);
  }, [descriptionSections, pendingSectionTitleFocusId]);
  const detailBlocksStorage = useMemo(
    () => ({
      hasCustomColumn: editableColumnNames.has("custom_detail_blocks_json"),
      hasLayoutColumn: editableColumnNames.has("detail_blocks_layout_json"),
    }),
    [editableColumnNames],
  );
  const listingButtonsStorage = useMemo(
    () => ({
      hasButtonsColumn: editableColumnNames.has("listing_buttons_json"),
    }),
    [editableColumnNames],
  );
  const customDetailBlocks = useMemo(
    () =>
      normalizeEditableDetailBlocks(
        readRecordJsonField(form, "custom_detail_blocks_json"),
      ),
    [form],
  );
  const detailBlockLayout = useMemo(() => {
    const normalized = normalizePropertyDetailBlockLayout(
      readRecordJsonField(form, "detail_blocks_layout_json"),
    );
    if (normalized.length > 0) return normalized;
    return [
      ...getDefaultPropertyDetailBlockLayout(),
      ...customDetailBlocks.map((block, index) => ({
        id: block.id,
        kind: "custom" as const,
        order: getDefaultPropertyDetailBlockLayout().length + index,
        visible: true,
      })),
    ];
  }, [customDetailBlocks, form]);
  const listingButtons = useMemo(
    () =>
      normalizeEditableListingButtons(
        readRecordJsonField(form, "listing_buttons_json"),
      ),
    [form],
  );
  const propertySizePreview = useMemo(() => {
    const size = String(form.lot_size ?? "").trim();
    const postfix = String(form.size_postfix ?? "").trim();
    return [size, postfix].filter(Boolean).join(" ").trim();
  }, [form.lot_size, form.size_postfix]);

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
  const setDetailBlocksData = (
    blocks: EditableDetailBlock[],
    layout: PropertyDetailBlockLayoutItem[],
  ) => {
    const normalizedBlocks = blocks.map((block, index) => ({
      id: block.id || createSectionId(),
      title: String(block.title || ""),
      order: index,
      items: block.items.map((item) => ({
        label: String(item.label || ""),
        value: String(item.value || ""),
      })),
    }));
    const normalizedLayout = layout.map((item, index) => ({
      id: item.id,
      kind: item.kind,
      order: index,
      visible: item.visible !== false,
    }));
    setForm((prev) => {
      const next = { ...prev };
      const meta = parseJsonObject(next.wp_meta_json);
      if (detailBlocksStorage.hasCustomColumn) {
        next.custom_detail_blocks_json = normalizedBlocks;
        delete meta.custom_detail_blocks_json;
      } else {
        meta.custom_detail_blocks_json = normalizedBlocks;
      }
      if (detailBlocksStorage.hasLayoutColumn) {
        next.detail_blocks_layout_json = normalizedLayout;
        delete meta.detail_blocks_layout_json;
      } else {
        meta.detail_blocks_layout_json = normalizedLayout;
      }
      next.wp_meta_json = meta;
      return next;
    });
  };
  const syncDetailBlocks = (
    updater: (state: {
      blocks: EditableDetailBlock[];
      layout: PropertyDetailBlockLayoutItem[];
    }) => {
      blocks: EditableDetailBlock[];
      layout: PropertyDetailBlockLayoutItem[];
    },
  ) => {
    const next = updater({
      blocks: customDetailBlocks,
      layout: detailBlockLayout,
    });
    setDetailBlocksData(next.blocks, next.layout);
  };
  const addCustomDetailBlock = () => {
    syncDetailBlocks(({ blocks, layout }) => {
      const id = `custom_${createSectionId()}`;
      return {
        blocks: [
          ...blocks,
          {
            id,
            title: "",
            order: blocks.length,
            items: [{ label: "", value: "" }],
          },
        ],
        layout: [
          ...layout,
          { id, kind: "custom", order: layout.length, visible: true },
        ],
      };
    });
  };
  const updateCustomDetailBlock = (
    blockId: string,
    value: Partial<Pick<EditableDetailBlock, "title" | "items">>,
  ) => {
    syncDetailBlocks(({ blocks, layout }) => ({
      blocks: blocks.map((block) =>
        block.id === blockId ? { ...block, ...value } : block,
      ),
      layout,
    }));
  };
  const removeCustomDetailBlock = (blockId: string) => {
    syncDetailBlocks(({ blocks, layout }) => ({
      blocks: blocks.filter((block) => block.id !== blockId),
      layout: layout.filter((item) => item.id !== blockId),
    }));
  };
  const toggleDetailBlockVisibility = (blockId: string) => {
    syncDetailBlocks(({ blocks, layout }) => ({
      blocks,
      layout: layout.map((item) =>
        item.id === blockId ? { ...item, visible: !item.visible } : item,
      ),
    }));
  };
  const moveDetailBlock = (blockId: string, direction: -1 | 1) => {
    syncDetailBlocks(({ blocks, layout }) => {
      const index = layout.findIndex((item) => item.id === blockId);
      return { blocks, layout: index < 0 ? layout : moveItem(layout, index, direction) };
    });
  };
  const setListingButtonsData = (buttons: EditableListingButton[]) => {
    const normalized = buttons.map((button, index) => ({
      id: button.id || `listing_button_${createSectionId()}`,
      label: String(button.label || ""),
      href: String(button.href || ""),
      order: index,
      requires_phone_verification: Boolean(button.requiresPhoneVerification),
    }));
    setForm((prev) => {
      const next = { ...prev };
      const meta = parseJsonObject(next.wp_meta_json);
      if (listingButtonsStorage.hasButtonsColumn) {
        next.listing_buttons_json = normalized;
        delete meta.listing_buttons_json;
      } else {
        meta.listing_buttons_json = normalized;
      }
      next.wp_meta_json = meta;
      return next;
    });
  };
  const addListingButton = () => {
    setListingButtonsData([
      ...listingButtons,
      {
        id: `listing_button_${createSectionId()}`,
        label: "",
        href: "",
        order: listingButtons.length,
        requiresPhoneVerification: false,
      },
    ]);
  };
  const updateListingButton = (
    buttonId: string,
    updates: Partial<EditableListingButton>,
  ) => {
    setListingButtonsData(
      listingButtons.map((button) =>
        button.id === buttonId ? { ...button, ...updates } : button,
      ),
    );
  };
  const removeListingButton = (buttonId: string) => {
    setListingButtonsData(
      listingButtons.filter((button) => button.id !== buttonId),
    );
  };
  const moveListingButton = (buttonId: string, direction: -1 | 1) => {
    const index = listingButtons.findIndex((button) => button.id === buttonId);
    if (index < 0) return;
    setListingButtonsData(moveItem(listingButtons, index, direction));
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
  const addDescriptionSection = (afterIndex?: number) => {
    const newSection: DescriptionSection = {
      id: createSectionId(),
      title: "",
      body_html: "",
      order: descriptionSections.length,
    };

    if (typeof afterIndex !== "number") {
      setDescriptionSections([...descriptionSections, newSection]);
      setPendingSectionTitleFocusId(newSection.id);
      return;
    }

    setDescriptionSections([
      ...descriptionSections.slice(0, afterIndex + 1),
      newSection,
      ...descriptionSections.slice(afterIndex + 1),
    ]);
    setPendingSectionTitleFocusId(newSection.id);
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
  const moveDescriptionSection = (sectionId: string, direction: -1 | 1) => {
    const index = descriptionSections.findIndex(
      (section) => section.id === sectionId,
    );
    if (index < 0) return;
    setDescriptionSections(moveItem(descriptionSections, index, direction));
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
    setGalleryUrls((prev) => moveItem(prev, index, direction));
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

  const toggleCloudinarySelection = (url: string) => {
    setSelectedCloudinaryUrls((prev) =>
      prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url],
    );
  };

  const loadCloudinaryAssetsPage = async ({
    pageIndex,
    requestCursor,
    resetSelection = false,
  }: {
    pageIndex: number;
    requestCursor: string | null;
    resetSelection?: boolean;
  }) => {
    if (cloudinaryLoading) return;
    setCloudinaryLoading(true);
    setCloudinaryError("");
    try {
      const payload = await fetchEstateCloudinaryAssets({
        max_results: CLOUDINARY_PICK_PAGE_SIZE,
        next_cursor: requestCursor || undefined,
        prefix: cloudinaryPrefixInput.trim() || undefined,
      });
      setCloudinaryResolvedPrefix(payload.prefix || "");
      setCloudinaryNextCursor(payload.next_cursor);
      setCloudinaryAssets(payload.results);
      setCloudinaryPageIndex(pageIndex);
      setCloudinaryPageCursors((prev) => {
        const next = prev.slice(0, pageIndex + 1);
        next[pageIndex] = requestCursor;
        if (payload.next_cursor) {
          next[pageIndex + 1] = payload.next_cursor;
        }
        return next;
      });
      if (resetSelection) {
        setSelectedCloudinaryUrls([]);
      }
    } catch (err: any) {
      setCloudinaryError(err?.message || "Unable to load Cloudinary images.");
    } finally {
      setCloudinaryLoading(false);
    }
  };

  const openCloudinaryPicker = async () => {
    setIsCloudinaryPickerOpen(true);
    setCloudinaryPageCursors([null]);
    setCloudinaryPageIndex(0);
    setCloudinaryAssets([]);
    setCloudinaryNextCursor(null);
    await loadCloudinaryAssetsPage({
      pageIndex: 0,
      requestCursor: null,
      resetSelection: true,
    });
  };

  const addSelectedCloudinaryImages = () => {
    if (selectedCloudinaryUrls.length === 0) return;
    setGalleryUrls((prev) =>
      normalizeImageUrls([...prev, ...selectedCloudinaryUrls]),
    );
    setIsCloudinaryPickerOpen(false);
    setSelectedCloudinaryUrls([]);
    setMediaError("");
  };
  const hasNextCloudinaryPage = Boolean(cloudinaryNextCursor);
  const hasPrevCloudinaryPage = cloudinaryPageIndex > 0;
  const goToNextCloudinaryPage = async () => {
    if (!cloudinaryNextCursor) return;
    await loadCloudinaryAssetsPage({
      pageIndex: cloudinaryPageIndex + 1,
      requestCursor: cloudinaryNextCursor,
      resetSelection: false,
    });
  };
  const goToPreviousCloudinaryPage = async () => {
    if (cloudinaryPageIndex <= 0) return;
    const prevIndex = cloudinaryPageIndex - 1;
    const cursor = cloudinaryPageCursors[prevIndex] ?? null;
    await loadCloudinaryAssetsPage({
      pageIndex: prevIndex,
      requestCursor: cursor,
      resetSelection: false,
    });
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
    const normalizedCustomBlocks = normalizePropertyCustomDetailBlocks(
      readRecordJsonField(normalizedPayload, "custom_detail_blocks_json"),
    );
    const normalizedBlockLayout = normalizePropertyDetailBlockLayout(
      readRecordJsonField(normalizedPayload, "detail_blocks_layout_json"),
    );
    const normalizedListingButtons = normalizeListingActionButtons(
      readRecordJsonField(normalizedPayload, "listing_buttons_json"),
    ).map((button, index) => ({
      id: button.id,
      label: button.label,
      href: button.href,
      order: index,
      requires_phone_verification: button.requiresPhoneVerification,
    }));
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
    if (detailBlocksStorage.hasCustomColumn) {
      normalizedPayload.custom_detail_blocks_json = normalizedCustomBlocks;
      delete normalizedPayload.wp_meta_json.custom_detail_blocks_json;
    } else {
      normalizedPayload.wp_meta_json.custom_detail_blocks_json = normalizedCustomBlocks;
      delete normalizedPayload.custom_detail_blocks_json;
    }
    if (detailBlocksStorage.hasLayoutColumn) {
      normalizedPayload.detail_blocks_layout_json = normalizedBlockLayout;
      delete normalizedPayload.wp_meta_json.detail_blocks_layout_json;
    } else {
      normalizedPayload.wp_meta_json.detail_blocks_layout_json = normalizedBlockLayout;
      delete normalizedPayload.detail_blocks_layout_json;
    }
    if (listingButtonsStorage.hasButtonsColumn) {
      normalizedPayload.listing_buttons_json = normalizedListingButtons;
      delete normalizedPayload.wp_meta_json.listing_buttons_json;
    } else {
      normalizedPayload.wp_meta_json.listing_buttons_json = normalizedListingButtons;
      delete normalizedPayload.listing_buttons_json;
    }
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
      <JsonImportSection
        jsonText={jsonText}
        jsonError={jsonError}
        onJsonTextChange={setJsonText}
        onApplyJsonPayload={applyJsonPayload}
      />

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
                property_slug
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
                form.listing_url ||
                  "/estate/" + (form.property_slug || "<auto-generated>"),
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
                        <div className="inline-flex gap-1 rounded border p-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveDescriptionSection(section.id, -1)}
                            className="px-2 py-1 text-xs rounded disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            disabled={index === descriptionSections.length - 1}
                            onClick={() => moveDescriptionSection(section.id, 1)}
                            className="px-2 py-1 text-xs rounded disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Down
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => addDescriptionSection(index)}
                          className="px-2 py-1 text-xs rounded border"
                        >
                          Add below
                        </button>
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
                        ref={(element) => {
                          sectionTitleRefs.current[section.id] = element;
                        }}
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

          <div className="bg-white border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Property Record Blocks</h2>
                <p className="text-xs text-gray-500">
                  Arrange default blocks and add custom blocks for this listing.
                </p>
              </div>
              <button
                type="button"
                onClick={addCustomDetailBlock}
                className="px-2 py-1 text-xs rounded border"
              >
                Add Custom Block
              </button>
            </div>
            {!detailBlocksStorage.hasCustomColumn ||
            !detailBlocksStorage.hasLayoutColumn ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Custom block data is being stored in wp_meta_json until the
                dedicated backend columns are available.
              </div>
            ) : null}
            <div className="space-y-3">
              {detailBlockLayout.map((layoutItem, index) => {
                const customBlock = customDetailBlocks.find(
                  (block) => block.id === layoutItem.id,
                );
                const title =
                  layoutItem.kind === "default"
                    ? DEFAULT_DETAIL_BLOCK_TITLES[layoutItem.id] || layoutItem.id
                    : customBlock?.title || "Untitled custom block";
                return (
                  <div
                    key={layoutItem.id}
                    className={`rounded-lg border p-3 space-y-3 ${
                      layoutItem.visible ? "bg-white" : "bg-gray-50 opacity-75"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          {index + 1}. {title}
                        </div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">
                          {layoutItem.kind === "default" ? "Default block" : "Custom block"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveDetailBlock(layoutItem.id, -1)}
                          disabled={index === 0}
                          className="px-2 py-1 text-xs rounded border disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDetailBlock(layoutItem.id, 1)}
                          disabled={index === detailBlockLayout.length - 1}
                          className="px-2 py-1 text-xs rounded border disabled:opacity-40"
                        >
                          Down
                        </button>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={layoutItem.visible}
                            onChange={() => toggleDetailBlockVisibility(layoutItem.id)}
                          />
                          Visible
                        </label>
                        {layoutItem.kind === "custom" ? (
                          <button
                            type="button"
                            onClick={() => removeCustomDetailBlock(layoutItem.id)}
                            className="px-2 py-1 text-xs rounded border text-red-600"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {layoutItem.kind === "custom" && customBlock ? (
                      <div className="space-y-3">
                        <label className="space-y-1 block">
                          <span className="text-xs font-semibold text-gray-600">
                            block title
                          </span>
                          <input
                            value={customBlock.title}
                            onChange={(e) =>
                              updateCustomDetailBlock(customBlock.id, {
                                title: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                            placeholder="Payment Plan"
                          />
                        </label>
                        <div className="space-y-2">
                          {customBlock.items.map((item, rowIndex) => (
                            <div
                              key={`${customBlock.id}-${rowIndex}`}
                              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2"
                            >
                              <input
                                value={item.label}
                                onChange={(e) => {
                                  const nextItems = customBlock.items.map((row, idx) =>
                                    idx === rowIndex
                                      ? { ...row, label: e.target.value }
                                      : row,
                                  );
                                  updateCustomDetailBlock(customBlock.id, {
                                    items: nextItems,
                                  });
                                }}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                placeholder="Label"
                              />
                              <input
                                value={item.value}
                                onChange={(e) => {
                                  const nextItems = customBlock.items.map((row, idx) =>
                                    idx === rowIndex
                                      ? { ...row, value: e.target.value }
                                      : row,
                                  );
                                  updateCustomDetailBlock(customBlock.id, {
                                    items: nextItems,
                                  });
                                }}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateCustomDetailBlock(customBlock.id, {
                                    items: customBlock.items.filter(
                                      (_, idx) => idx !== rowIndex,
                                    ),
                                  })
                                }
                                className="px-2 py-1 text-xs rounded border text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateCustomDetailBlock(customBlock.id, {
                              items: [
                                ...customBlock.items,
                                { label: "", value: "" },
                              ],
                            })
                          }
                          className="px-2 py-1 text-xs rounded border"
                        >
                          Add Row
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Listing Buttons</h2>
                <p className="text-xs text-gray-500">
                  Add Drive links shown on the estate listing page.
                </p>
              </div>
              <button
                type="button"
                onClick={addListingButton}
                className="px-2 py-1 text-xs rounded border"
              >
                Add Button
              </button>
            </div>
            {!listingButtonsStorage.hasButtonsColumn ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Button data is being stored in wp_meta_json until the dedicated
                backend column is available.
              </div>
            ) : null}
            {listingButtons.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                No listing buttons yet.
              </div>
            ) : null}
            <div className="space-y-3">
              {listingButtons.map((button, index) => (
                <div key={button.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      Button {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveListingButton(button.id, -1)}
                        disabled={index === 0}
                        className="px-2 py-1 text-xs rounded border disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveListingButton(button.id, 1)}
                        disabled={index === listingButtons.length - 1}
                        className="px-2 py-1 text-xs rounded border disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeListingButton(button.id)}
                        className="px-2 py-1 text-xs rounded border text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-600">
                        label
                      </span>
                      <input
                        value={button.label}
                        onChange={(e) =>
                          updateListingButton(button.id, {
                            label: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        placeholder="Download floor plan"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-600">
                        Drive link
                      </span>
                      <input
                        value={button.href}
                        onChange={(e) =>
                          updateListingButton(button.id, {
                            href: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        placeholder="https://drive.google.com/..."
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={button.requiresPhoneVerification}
                      onChange={(e) =>
                        updateListingButton(button.id, {
                          requiresPhoneVerification: e.target.checked,
                        })
                      }
                    />
                    Require verified phone number
                  </label>
                </div>
              ))}
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
                  property_size (lot_size + size_postfix)
                </span>
                <input
                  value={propertySizePreview}
                  readOnly
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 text-gray-700"
                  placeholder="Set lot_size and size_postfix"
                />
              </label>
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
                      {ADMIN_FIELD_LABELS[key] || key}
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
                  onChange={(e) => handleChange("custom_tags", e.target.value)}
                  placeholder="Luxury, Waterfront, Corner Lot"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <span className="text-[11px] text-gray-500">
                  Comma-separated tags. “Featured” is controlled by the checkbox above.
                </span>
              </label>
            ) : null}
          </div>

          <MediaSection
            galleryUrlInput={galleryUrlInput}
            galleryUrls={galleryUrls}
            pendingUploads={pendingUploads}
            pendingUploadPreviews={pendingUploadPreviews}
            mediaError={mediaError}
            videoUrl={String((form.wp_meta_json?.video_url as string) ?? "")}
            onGalleryUrlInputChange={setGalleryUrlInput}
            onAddGalleryUrl={addGalleryUrl}
            onLocalUploads={handleLocalUploads}
            onOpenCloudinaryPicker={() => void openCloudinaryPicker()}
            onRemovePendingUpload={removePendingUpload}
            onMoveGalleryUrl={moveGalleryUrl}
            onRemoveGalleryUrl={removeGalleryUrl}
            onVideoUrlChange={(value) =>
              setJsonField("wp_meta_json", {
                ...(typeof form.wp_meta_json === "object" && form.wp_meta_json
                  ? form.wp_meta_json
                  : {}),
                video_url: value,
              })
            }
          />
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

      <SubmitBar
        isSaving={isSaving}
        isUploadingMedia={isUploadingMedia}
        submitLabel={submitLabel}
        onSaveDraft={handleSaveDraft}
      />

      <CloudinaryPickerDialog
        open={isCloudinaryPickerOpen}
        onOpenChange={setIsCloudinaryPickerOpen}
        prefixInput={cloudinaryPrefixInput}
        onPrefixInputChange={setCloudinaryPrefixInput}
        resolvedPrefix={cloudinaryResolvedPrefix}
        error={cloudinaryError}
        loading={cloudinaryLoading}
        assets={cloudinaryAssets}
        selectedUrls={selectedCloudinaryUrls}
        pageIndex={cloudinaryPageIndex}
        hasPreviousPage={hasPrevCloudinaryPage}
        hasNextPage={hasNextCloudinaryPage}
        onRefresh={() =>
          void loadCloudinaryAssetsPage({
            pageIndex: 0,
            requestCursor: null,
            resetSelection: true,
          })
        }
        onToggleSelection={toggleCloudinarySelection}
        onPreviousPage={() => void goToPreviousCloudinaryPage()}
        onNextPage={() => void goToNextCloudinaryPage()}
        onAddSelected={addSelectedCloudinaryImages}
      />
    </form>
  );
}


