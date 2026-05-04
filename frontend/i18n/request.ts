import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const LOCALES = ["en", "zh-Hans"] as const;
export type AppLocale = (typeof LOCALES)[number];

function normalizeLocale(raw: string | undefined): AppLocale {
  if (raw === "zh-Hans" || raw === "zh") return "zh-Hans";
  return "en";
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = normalizeLocale(store.get("NEXT_LOCALE")?.value);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
