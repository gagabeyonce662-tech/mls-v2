"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const COOKIE = "NEXT_LOCALE";
const MAX_AGE = 60 * 60 * 24 * 365;

export function ListingLocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Listing");

  const setLocale = (next: "en" | "zh-Hans") => {
    if (next === locale) return;
    document.cookie = `${COOKIE}=${next};path=/;max-age=${MAX_AGE};SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-ds-body">
      <span className="font-medium text-ds-heading">{t("localeSwitcherLabel")}:</span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-lg px-3 py-1.5 border transition-colors ${
          locale === "en"
            ? "border-ds-primary bg-ds-primary/10 text-ds-heading font-semibold"
            : "border-ds-card-border hover:bg-ds-card/50"
        }`}
      >
        {t("localeEn")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("zh-Hans")}
        className={`rounded-lg px-3 py-1.5 border transition-colors ${
          locale === "zh-Hans"
            ? "border-ds-primary bg-ds-primary/10 text-ds-heading font-semibold"
            : "border-ds-card-border hover:bg-ds-card/50"
        }`}
      >
        {t("localeZh")}
      </button>
    </div>
  );
}
