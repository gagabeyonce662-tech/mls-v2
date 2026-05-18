"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useUserAuth } from "@/contexts/UserAuthContext";
import {
  WatchedAlertPreferences,
  WatchedFollowedAreaRow,
  buildPropertySnapshotJson,
  clearWatchedAreasServer,
  clearWatchedFavoritesServer,
  clearWatchedHistoryServer,
  clearWatchedTouredServer,
  fetchWatchedOverview,
  hydrateWatchedProperty,
  postFollowArea,
  postWatchedFavoriteToggle,
  postWatchedHistoryAdd,
  postWatchedTouredToggle,
  postUnfollowArea,
  putAlertPreferences,
} from "@/lib/api/watched";

interface WatchedContextType {
  favoritesList: any[];
  historyList: any[];
  touredList: any[];
  followedAreas: WatchedFollowedAreaRow[];
  alertPreferences: WatchedAlertPreferences;
  toggleFavorite: (property: any) => void;
  addToHistory: (property: any) => void;
  toggleToured: (property: any) => void;
  isToured: (propertyId: string) => boolean;
  followArea: (area: {
    area_key: string;
    area_label: string;
    area_kind?: string;
    metadata_json?: Record<string, unknown>;
  }) => void;
  unfollowArea: (areaKey: string) => void;
  updateAlertPrefs: (
    payload: Partial<WatchedAlertPreferences>,
  ) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  clearFavorites: () => void;
  clearHistory: () => void;
  clearToured: () => void;
  clearFollowedAreas: () => void;
  getPropertyKey: (property: any) => string;
}

const WatchedContext = createContext<WatchedContextType | undefined>(undefined);

// useWatched hook for easy access to the context
// It will throw an error if used outside of the WatchedProvider, which helps catch mistakes early.
// The WatchedProvider is a higher-level component that should wrap around any part of the app that needs access to the watched properties state and actions.
// By higher-level we mean that it should be placed near the root of the component tree, such as in the main App component or a layout component, to ensure that all child components can access the context without issues.

export const useWatched = () => {
  const context = useContext(WatchedContext);
  if (!context) {
    throw new Error("useWatched must be used within a WatchedProvider");
  }
  return context;
};

function mergeServerFirst(
  serverItems: any[],
  localPrev: any[],
  getKey: (p: any) => string,
): any[] {
  const serverKeys = new Set(serverItems.map((p) => getKey(p)));
  const extras = localPrev.filter((p) => !serverKeys.has(getKey(p)));
  return [...serverItems, ...extras];
}

export const WatchedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading: authLoading } = useUserAuth();
  const [favoritesList, setFavoritesList] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("favorite_properties");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });
  const [historyList, setHistoryList] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("history_properties");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });
  const [touredList, setTouredList] = useState<any[]>([]);
  const [followedAreas, setFollowedAreas] = useState<WatchedFollowedAreaRow[]>(
    [],
  );
  const [alertPreferences, setAlertPreferences] =
    useState<WatchedAlertPreferences>({
      price_changes: true,
      new_listings: true,
      status_updates: true,
      email_enabled: true,
      email_recommend: true,
      email_watched_property: true,
      email_watched_community: true,
      email_watched_area: true,
      push_watched_property: true,
    });

  // Helper to get consistent keys
  const getPropertyKey = useCallback((property: any) => {
    return (
      property?.listing_key ||
      property?.PropertyKey ||
      property?.id ||
      String(property?.ListingId || "") ||
      `property-${property?.city || "unknown"}-${property?.list_price || property?.ListPrice || "0"}`
    );
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("access_token")) return;
    let cancelled = false;
    (async () => {
      const data = await fetchWatchedOverview();
      if (cancelled || !data) return;
      const fromFavs = (data.favorites || []).map(hydrateWatchedProperty);
      const fromHist = (data.history || []).map(hydrateWatchedProperty);
      const fromToured = (data.toured || []).map(hydrateWatchedProperty);
      setFavoritesList((prev) =>
        mergeServerFirst(fromFavs, prev, getPropertyKey),
      );
      setHistoryList((prev) =>
        mergeServerFirst(fromHist, prev, getPropertyKey),
      );
      setTouredList((prev) =>
        mergeServerFirst(fromToured, prev, getPropertyKey),
      );
      setFollowedAreas(data.followed_areas || []);
      if (data.alert_preferences) setAlertPreferences(data.alert_preferences);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, getPropertyKey]);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("favorite_properties", JSON.stringify(favoritesList));
  }, [favoritesList]);

  useEffect(() => {
    localStorage.setItem("history_properties", JSON.stringify(historyList));
  }, [historyList]);

  const isFavorite = useCallback(
    (propertyId: string) => {
      return favoritesList.some((p) => getPropertyKey(p) === propertyId);
    },
    [favoritesList, getPropertyKey],
  );

  const toggleFavorite = useCallback(
    (property: any) => {
      const key = getPropertyKey(property);
      let wasFavorite = false;
      setFavoritesList((prev) => {
        wasFavorite = prev.some((p) => getPropertyKey(p) === key);
        if (wasFavorite) {
          return prev.filter((p) => getPropertyKey(p) !== key);
        }
        return [property, ...prev];
      });
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("access_token")
      ) {
        void postWatchedFavoriteToggle(
          key,
          wasFavorite ? {} : buildPropertySnapshotJson(property),
        );
      }
    },
    [getPropertyKey],
  );

  const addToHistory = useCallback(
    (property: any) => {
      const key = getPropertyKey(property);
      setHistoryList((prev) => {
        // Remove if already exists to move to top
        const filtered = prev.filter((p) => getPropertyKey(p) !== key);
        return [property, ...filtered].slice(0, 50); // Keep last 50
      });
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("access_token")
      ) {
        void postWatchedHistoryAdd(key, buildPropertySnapshotJson(property));
      }
    },
    [getPropertyKey],
  );

  const isToured = useCallback(
    (propertyId: string) => {
      return touredList.some((p) => getPropertyKey(p) === propertyId);
    },
    [touredList, getPropertyKey],
  );

  const toggleToured = useCallback(
    (property: any) => {
      const key = getPropertyKey(property);
      let wasToured = false;
      setTouredList((prev) => {
        wasToured = prev.some((p) => getPropertyKey(p) === key);
        if (wasToured) {
          return prev.filter((p) => getPropertyKey(p) !== key);
        }
        return [property, ...prev];
      });
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("access_token")
      ) {
        void postWatchedTouredToggle(
          key,
          wasToured ? {} : buildPropertySnapshotJson(property),
        );
      }
    },
    [getPropertyKey],
  );

  const followArea = useCallback(
    (area: {
      area_key: string;
      area_label: string;
      area_kind?: string;
      metadata_json?: Record<string, unknown>;
    }) => {
      if (!area.area_key) return;
      setFollowedAreas((prev) => {
        if (prev.some((x) => x.area_key === area.area_key)) return prev;
        return [
          {
            area_key: area.area_key,
            area_label: area.area_label,
            area_kind: area.area_kind || "community",
            metadata_json: area.metadata_json || {},
            created_at: new Date().toISOString(),
          },
          ...prev,
        ];
      });
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("access_token")
      ) {
        void postFollowArea(area);
      }
    },
    [],
  );

  const unfollowArea = useCallback((areaKey: string) => {
    setFollowedAreas((prev) => prev.filter((x) => x.area_key !== areaKey));
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      void postUnfollowArea(areaKey);
    }
  }, []);

  const updateAlertPrefs = useCallback(
    async (payload: Partial<WatchedAlertPreferences>) => {
      setAlertPreferences((prev) => ({ ...prev, ...payload }));
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("access_token")
      ) {
        const next = await putAlertPreferences(payload);
        if (next) setAlertPreferences(next);
      }
    },
    [],
  );

  const clearFavorites = useCallback(() => {
    setFavoritesList([]);
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      void clearWatchedFavoritesServer();
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistoryList([]);
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      void clearWatchedHistoryServer();
    }
  }, []);

  const clearToured = useCallback(() => {
    setTouredList([]);
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      void clearWatchedTouredServer();
    }
  }, []);

  const clearFollowedAreas = useCallback(() => {
    setFollowedAreas([]);
    if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
      void clearWatchedAreasServer();
    }
  }, []);

  return (
    <WatchedContext.Provider
      value={{
        favoritesList,
        historyList,
        touredList,
        followedAreas,
        alertPreferences,
        toggleFavorite,
        addToHistory,
        toggleToured,
        isToured,
        followArea,
        unfollowArea,
        updateAlertPrefs,
        isFavorite,
        clearFavorites,
        clearHistory,
        clearToured,
        clearFollowedAreas,
        getPropertyKey,
      }}
    >
      {children}
    </WatchedContext.Provider>
  );
};
