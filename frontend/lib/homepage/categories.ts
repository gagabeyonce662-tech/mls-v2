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

export const buildPropertyTypeCategoryKey = (propertyType: string): string =>
  `property_type:${normalize(propertyType)}`;

export function mergeHomepageCategories(
  backend: HomepageCategory[],
  options?: { maxSections?: number; minCountThreshold?: number },
): HomepageCategory[] {
  const configMap = new Map(HOMEPAGE_CATEGORY_DEFAULTS.map((cfg) => [cfg.key, cfg]));
  const maxSections = options?.maxSections ?? HOMEPAGE_MAX_SECTIONS;
  const minCountThreshold =
    options?.minCountThreshold ?? HOMEPAGE_MIN_COUNT_THRESHOLD;

  const merged = backend
    .map((category) => {
      const cfg = configMap.get(category.key);
      if (!cfg) return null;
      if (!cfg.enabled) return null;

      const threshold = Math.max(cfg.minCount, minCountThreshold);
      const isAlwaysVisible = ["newly_listed", "exclusive", "rental", "precon"].includes(
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
        query: cfg.query,
        enabled: true,
        order: cfg.order,
      } satisfies HomepageCategory;
    })
    .filter((item): item is HomepageCategory => Boolean(item))
    .sort((a, b) => a.order - b.order)
    .slice(0, maxSections);

  if (merged.length === 0) {
    return toCatalogFallback().categories;
  }

  return merged;
}
