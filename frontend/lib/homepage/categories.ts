import type { HomepageCategory, HomepageCategoryCatalog } from "@/lib/api/types";

export interface HomepageCategoryConfigItem {
  key: string;
  label: string;
  kind: HomepageCategory["kind"];
  route: string;
  query?: Record<string, string>;
  order: number;
  enabled: boolean;
  minCount: number;
  allowWhenCountMissing?: boolean;
}

export const HOMEPAGE_CATEGORY_DEFAULTS: HomepageCategoryConfigItem[] = [
  {
    key: "newly_listed",
    label: "Newly Listed Properties",
    kind: "newly_listed",
    route: "/new-listings",
    order: 10,
    enabled: true,
    minCount: 1,
  },
  {
    key: "exclusive",
    label: "Exclusive Properties",
    kind: "exclusive",
    route: "/listing",
    order: 20,
    enabled: true,
    minCount: 1,
  },
  {
    key: "community",
    label: "Community Listings",
    kind: "community",
    route: "/community-listings",
    order: 25,
    enabled: true,
    minCount: 1,
  },
  {
    key: "rental",
    label: "Rental Properties",
    kind: "rental",
    route: "/listing/rental",
    order: 30,
    enabled: true,
    minCount: 1,
  },
  {
    key: "precon",
    label: "Pre-Construction Properties",
    kind: "precon",
    route: "/pre-construction",
    order: 40,
    enabled: true,
    minCount: 1,
  },
  {
    key: "property_type:condo-apt",
    label: "Condo Apartments",
    kind: "property_type",
    route: "/listing",
    query: { property_type: "Condo Apt" },
    order: 50,
    enabled: true,
    minCount: 5,
    allowWhenCountMissing: true,
  },
  {
    key: "property_type:detached",
    label: "Detached Homes",
    kind: "property_type",
    route: "/listing",
    query: { property_type: "Detached" },
    order: 60,
    enabled: true,
    minCount: 5,
    allowWhenCountMissing: true,
  },
  {
    key: "property_type:semi-detached",
    label: "Semi-Detached Homes",
    kind: "property_type",
    route: "/listing",
    query: { property_type: "Semi-Detached" },
    order: 70,
    enabled: true,
    minCount: 5,
    allowWhenCountMissing: true,
  },
  {
    key: "property_type:freehold-townhouse",
    label: "Freehold Townhouses",
    kind: "property_type",
    route: "/listing",
    query: { property_type: "Freehold Townhouse" },
    order: 80,
    enabled: true,
    minCount: 5,
    allowWhenCountMissing: true,
  },
  {
    key: "property_type:condo-townhouse",
    label: "Condo Townhouses",
    kind: "property_type",
    route: "/listing",
    query: { property_type: "Condo Townhouse" },
    order: 90,
    enabled: true,
    minCount: 5,
    allowWhenCountMissing: true,
  },
];

export const HOMEPAGE_MAX_SECTIONS = 8;
export const HOMEPAGE_MIN_COUNT_THRESHOLD = 5;

export const toCatalogFallback = (): HomepageCategoryCatalog => ({
  fetchedAt: new Date().toISOString(),
  categories: HOMEPAGE_CATEGORY_DEFAULTS
    .filter((item) => item.enabled)
    .map((item) => ({
      key: item.key,
      kind: item.kind,
      label: item.label,
      count: 0,
      enabled: true,
      route: item.route,
      query: item.query,
      source: "fallback" as const,
      order: item.order,
    })),
});

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  "condo-apartment": "condo-apt",
  "condo-apt": "condo-apt",
  detached: "detached",
  "semi-detached": "semi-detached",
  semidetached: "semi-detached",
  "freehold-townhouse": "freehold-townhouse",
  townhouse: "freehold-townhouse",
  "condo-townhouse": "condo-townhouse",
};

export const buildPropertyTypeCategoryKey = (propertyType: string): string =>
  `property_type:${PROPERTY_TYPE_ALIASES[normalize(propertyType)] || normalize(propertyType)}`;

const isHomepageCategory = (
  item: HomepageCategory | null,
): item is HomepageCategory => item !== null;

export function mergeHomepageCategories(
  backend: HomepageCategory[],
  options?: { maxSections?: number; minCountThreshold?: number },
): HomepageCategory[] {
  const configMap = new Map(HOMEPAGE_CATEGORY_DEFAULTS.map((cfg) => [cfg.key, cfg]));
  const maxSections = options?.maxSections ?? HOMEPAGE_MAX_SECTIONS;
  const minCountThreshold =
    options?.minCountThreshold ?? HOMEPAGE_MIN_COUNT_THRESHOLD;

  const known = backend
    .map<HomepageCategory | null>((category) => {
      const cfg = configMap.get(category.key);
      if (!cfg) return null;
      if (!cfg.enabled) return null;

      const threshold = Math.max(cfg.minCount, minCountThreshold);
      const isAlwaysVisible = ["newly_listed", "exclusive", "community", "rental", "precon"].includes(
        cfg.key,
      );
      const hasCount = Number.isFinite(category.count);
      if (!isAlwaysVisible) {
        if (hasCount && category.count < threshold) return null;
        if (!hasCount && !cfg.allowWhenCountMissing) return null;
      }

      return {
        ...category,
        label: cfg.label,
        kind: cfg.kind,
        route: cfg.route,
        enabled: true,
        order: cfg.order,
        ...(cfg.query ? { query: cfg.query } : {}),
      };
    })
    .filter(isHomepageCategory)
    .sort((a, b) => a.order - b.order);

  const unknownPropertyTypes = backend
    .filter((category) => category.kind === "property_type")
    .filter((category) => !configMap.has(category.key))
    .filter((category) => {
      const hasCount = Number.isFinite(category.count);
      if (!hasCount) return true;
      return category.count >= minCountThreshold;
    })
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((category, index) => ({
      ...category,
      enabled: true,
      order: 1000 + index,
      route: "/listing",
      query: category.query,
    }));

  const merged = [...known, ...unknownPropertyTypes].slice(0, maxSections);

  if (merged.length === 0) {
    return toCatalogFallback().categories;
  }

  return merged;
}
