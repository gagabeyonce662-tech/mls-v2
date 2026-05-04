/** Minimal listing-page copy scaffold (extend locales + wire cookie/header later). */

export type ListingLocale = "en" | "zh-Hans";

const en = {
  mortgageCalculatorTitle: "Mortgage Calculator",
  cashFlowEstimatorTitle: "Cash flow estimator",
  catalogStatsTitle: "Listing activity in our catalog",
  engagementTitle: "Interest on this site",
  demographicsTitle: "Neighbourhood demographics",
  myNotesTitle: "My notes",
} as const;

const zhHans: Record<keyof typeof en, string> = {
  mortgageCalculatorTitle: "按揭计算器",
  cashFlowEstimatorTitle: "现金流估算",
  catalogStatsTitle: "本站挂牌数据概况",
  engagementTitle: "本站关注度",
  demographicsTitle: "社区人口统计",
  myNotesTitle: "我的备注",
};

const catalogs: Record<ListingLocale, Record<keyof typeof en, string>> = {
  en: { ...en },
  "zh-Hans": zhHans,
};

export function listingT(
  locale: ListingLocale,
  key: keyof typeof en,
): string {
  return catalogs[locale][key] ?? en[key];
}
