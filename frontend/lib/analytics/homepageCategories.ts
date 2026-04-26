"use client";

type HomepageCategoryEvent =
  | "homepage_category_impression"
  | "homepage_category_click"
  | "homepage_category_view_all";

interface HomepageCategoryPayload {
  key: string;
  label: string;
  route: string;
}

export function trackHomepageCategoryEvent(
  event: HomepageCategoryEvent,
  payload: HomepageCategoryPayload,
) {
  if (typeof window === "undefined") return;
  const data = {
    event,
    ...payload,
    ts: Date.now(),
  };

  window.dispatchEvent(new CustomEvent("homepage-category-event", { detail: data }));
  if (process.env.NODE_ENV !== "production") {
    console.info("[homepage-category]", data);
  }
}
