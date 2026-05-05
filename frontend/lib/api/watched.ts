import { API_BASE_URL } from "./client";

function authHeader(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("access_token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type WatchedFavoriteRow = {
  property_key: string;
  property_snapshot_json: Record<string, unknown>;
  created_at: string;
};

export type WatchedHistoryRow = {
  property_key: string;
  property_snapshot_json: Record<string, unknown>;
  viewed_at: string;
};

export type WatchedTouredRow = {
  property_key: string;
  property_snapshot_json: Record<string, unknown>;
  toured_at: string;
};

export type WatchedFollowedAreaRow = {
  area_key: string;
  area_label: string;
  area_kind: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type WatchedAlertPreferences = {
  price_changes: boolean;
  new_listings: boolean;
  status_updates: boolean;
  email_enabled: boolean;
};

export type WatchedOverviewPayload = {
  favorites: WatchedFavoriteRow[];
  history: WatchedHistoryRow[];
  toured: WatchedTouredRow[];
  followed_areas: WatchedFollowedAreaRow[];
  alert_preferences: WatchedAlertPreferences;
};

/** Merge API row into a property-shaped object for cards and keys. */
export function hydrateWatchedProperty(
  row: WatchedFavoriteRow | WatchedHistoryRow | WatchedTouredRow,
): Record<string, unknown> {
  const snap = { ...(row.property_snapshot_json || {}) };
  const key = row.property_key;
  return {
    ...snap,
    listing_key: snap.listing_key ?? snap.ListingKey ?? key,
    ListingKey: snap.ListingKey ?? snap.listing_key ?? key,
  };
}

/** Minimal snapshot for server-side favorites/history (card + detail links). */
export function buildPropertySnapshotJson(
  property: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!property || typeof property !== "object") return {};
  const p = property;
  return {
    listing_key: p.listing_key ?? p.ListingKey,
    ListingKey: p.ListingKey ?? p.listing_key,
    list_price: p.list_price ?? p.ListPrice,
    ListPrice: p.ListPrice ?? p.list_price,
    city: p.city ?? p.City,
    City: p.City ?? p.city,
    unparsed_address: p.unparsed_address,
    standard_status: p.standard_status ?? p.StandardStatus,
    StandardStatus: p.StandardStatus ?? p.standard_status,
    media: p.media ?? p.Photos,
    Photos: p.Photos ?? p.media,
    latitude: p.latitude,
    longitude: p.longitude,
  };
}

export async function fetchWatchedOverview(): Promise<WatchedOverviewPayload | null> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/`, {
      headers: { ...authHeader() },
    });
    if (!res.ok) return null;
    return (await res.json()) as WatchedOverviewPayload;
  } catch {
    return null;
  }
}

export async function postWatchedFavoriteToggle(
  propertyKey: string,
  propertySnapshotJson: Record<string, unknown>,
): Promise<{ is_favorite: boolean } | null> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/favorites/toggle/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({
        property_key: propertyKey,
        property_snapshot_json: propertySnapshotJson,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { is_favorite: boolean };
  } catch {
    return null;
  }
}

export async function postWatchedHistoryAdd(
  propertyKey: string,
  propertySnapshotJson: Record<string, unknown>,
): Promise<boolean> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/history/add/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({
        property_key: propertyKey,
        property_snapshot_json: propertySnapshotJson,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postWatchedTouredToggle(
  propertyKey: string,
  propertySnapshotJson: Record<string, unknown>,
): Promise<{ is_toured: boolean } | null> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/toured/toggle/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({
        property_key: propertyKey,
        property_snapshot_json: propertySnapshotJson,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { is_toured: boolean };
  } catch {
    return null;
  }
}

export async function clearWatchedTouredServer(): Promise<boolean> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/toured/clear/`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postFollowArea(payload: {
  area_key: string;
  area_label: string;
  area_kind?: string;
  metadata_json?: Record<string, unknown>;
}): Promise<boolean> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/areas/follow/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postUnfollowArea(areaKey: string): Promise<boolean> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/areas/unfollow/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({ area_key: areaKey }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearWatchedAreasServer(): Promise<boolean> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/areas/clear/`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function putAlertPreferences(
  payload: Partial<WatchedAlertPreferences>,
): Promise<WatchedAlertPreferences | null> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/alerts/preferences/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as WatchedAlertPreferences;
  } catch {
    return null;
  }
}

export async function clearWatchedFavoritesServer(): Promise<boolean> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/favorites/clear/`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearWatchedHistoryServer(): Promise<boolean> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/api/mls/watched/history/clear/`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
    return res.ok;
  } catch {
    return false;
  }
}
