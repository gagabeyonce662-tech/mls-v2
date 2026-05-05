import { getRequestConfig } from "next-intl/server";

const LOCALES = ["en"] as const;
export type AppLocale = (typeof LOCALES)[number];

function normalizeLocale(): AppLocale {
  return "en";
}

export default getRequestConfig(async () => {
  const locale = normalizeLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
