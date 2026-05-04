import { API_BASE_URL } from "@/lib/api/client";

const SESSION_KEY = "listing_site_session_id";

export function getOrCreateListingSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id || id.length < 8) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id.slice(0, 64);
  } catch {
    return `sess_${Date.now()}`.slice(0, 64);
  }
}

export function postListingViewBeacon(
  listingKey: string,
  sessionId: string,
): void {
  const base = API_BASE_URL.replace(/\/+$/, "");
  void fetch(`${base}/api/mls/listing-views/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listing_key: listingKey,
      session_key: sessionId.slice(0, 64),
    }),
  }).catch(() => {});
}
