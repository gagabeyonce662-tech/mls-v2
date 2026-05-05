"use client";

import React, { useState } from "react";
import {
  Bell,
  Check,
  Clock,
  Heart,
  LineChart,
  Map,
  Search,
  Trash2,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { colors } from "@/config/design-system";
import { useWatched } from "@/contexts/WatchedContext";
import { useCompare } from "@/contexts/CompareContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { PropertyCard } from "@/components/listing/PropertyCard";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";
import { getDetailUrl } from "@/lib/propertyUtils";
import { openInNewTab } from "@/lib/navigation/openInNewTab";

export default function WatchedPage() {
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProperty, setQuickViewProperty] = useState<any>(null);

  const handleQuickView = (property: any) => {
    setQuickViewProperty(property);
    setShowQuickView(true);
  };
  const {
    favoritesList,
    historyList,
    touredList,
    followedAreas,
    alertPreferences,
    clearFavorites,
    clearHistory,
    clearToured,
    clearFollowedAreas,
    toggleToured,
    isToured,
    followArea,
    unfollowArea,
    updateAlertPrefs,
    getPropertyKey,
  } = useWatched();

  const { isPropertySelected, addToCompare, removeFromCompare, compareList } =
    useCompare();
  const { user } = useUserAuth();
  const isLoggedIn = !!user;

  const [activeTab, setActiveTab] = useState<
    "favorites" | "history" | "toured" | "areas"
  >(
    "history",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "for-sale" | "sold" | "de-listed"
  >("all");
  const [clickedProperty, setClickedProperty] = useState<string | null>(null);
  const [areaInput, setAreaInput] = useState("");

  const displayList =
    activeTab === "favorites"
      ? favoritesList
      : activeTab === "history"
        ? historyList
        : activeTab === "toured"
          ? touredList
          : [];

  const normalizeStatus = (property: any): "for-sale" | "sold" | "de-listed" => {
    const raw = String(
      property.standard_status || property.StandardStatus || "For Sale",
    ).toLowerCase();
    if (raw.includes("sold") || raw.includes("closed")) return "sold";
    if (
      raw.includes("de") ||
      raw.includes("withdrawn") ||
      raw.includes("expired") ||
      raw.includes("cancel")
    ) {
      return "de-listed";
    }
    return "for-sale";
  };

  const filteredProperties = displayList.filter((property: any) => {
    const address = (property.unparsed_address || "").toLowerCase();
    const city = (property.city || property.City || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = address.includes(term) || city.includes(term);
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && normalizeStatus(property) === statusFilter;
  });

  const handlePropertyClick = (property: any) => {
    const key = getPropertyKey(property);
    setClickedProperty(key);

    if (compareList.length > 0) {
      if (isPropertySelected(key)) {
        removeFromCompare(key);
      } else {
        addToCompare(property);
      }
      setTimeout(() => setClickedProperty(null), 300);
      return;
    }

    openInNewTab(getDetailUrl(property));
  };

  const formatPrice = (price: any) => {
    const numPrice =
      typeof price === "string"
        ? parseFloat(price.replace(/[^0-9.-]+/g, ""))
        : price || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div className="min-h-screen bg-ds-background flex flex-col font-inter">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <Container>
          <div className="mb-10 text-center md:text-left">
            <h1
              className="text-4xl font-extrabold tracking-tight"
              style={{ color: colors.heading }}
            >
              Your Collections
            </h1>
            <p className="mt-2 text-lg" style={{ color: colors.body }}>
              Manage your saved properties and viewing history in one place.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8 border-b border-ds-card-border">
            <div className="flex gap-8">
              <button
                onClick={() => {
                  setActiveTab("history");
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "history"
                    ? "text-ds-primary"
                    : "text-ds-body hover:text-ds-heading"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Browsing History ({historyList.length})
                </div>
                {activeTab === "history" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-ds-primary rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("favorites");
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "favorites"
                    ? "text-ds-primary"
                    : "text-ds-body hover:text-ds-heading"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Heart
                    className={`w-4 h-4 ${activeTab === "favorites" ? "fill-current" : ""}`}
                  />
                  Saved Homes ({favoritesList.length})
                </div>
                {activeTab === "favorites" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-ds-primary rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("toured");
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "toured" ? "text-ds-primary" : "text-ds-body hover:text-ds-heading"}`}
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Toured ({touredList.length})
                </div>
                {activeTab === "toured" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-ds-primary rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("areas");
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "areas" ? "text-ds-primary" : "text-ds-body hover:text-ds-heading"}`}
              >
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Areas & Communities ({followedAreas.length})
                </div>
                {activeTab === "areas" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-ds-primary rounded-t-full" />
                )}
              </button>
            </div>

            {(displayList.length > 0 || (activeTab === "areas" && followedAreas.length > 0)) && (
              <button
                onClick={() => {
                  const type =
                    activeTab === "favorites"
                      ? "saved homes"
                      : activeTab === "history"
                        ? "viewing history"
                        : activeTab === "toured"
                          ? "toured homes"
                          : "followed areas";
                  if (confirm(`Clear all your ${type}?`)) {
                    if (activeTab === "favorites") clearFavorites();
                    else if (activeTab === "history") clearHistory();
                    else if (activeTab === "toured") clearToured();
                    else clearFollowedAreas();
                  }
                }}
                className="pb-4 text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear {activeTab === "favorites" ? "All Favorites" : activeTab === "history" ? "History" : activeTab === "toured" ? "Toured" : "Areas"}
              </button>
            )}
          </div>

          <div className="mb-6 rounded-2xl border border-ds-card-border bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => openInNewTab("/tools")}
                className="inline-flex items-center gap-2 rounded-lg border border-ds-card-border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                <LineChart className="h-4 w-4" />
                Market Trends
              </button>
              <button
                onClick={() => openInNewTab("/map-search")}
                className="inline-flex items-center gap-2 rounded-lg border border-ds-card-border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                <Map className="h-4 w-4" />
                Map Search
              </button>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-ds-card-border bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-ds-primary" />
              <h2 className="text-sm font-bold text-ds-heading">Notifications</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["price_changes", "Price changes"],
                ["new_listings", "New listings in followed areas"],
                ["status_updates", "Status updates"],
                ["email_enabled", "Email delivery"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-ds-body">
                  <input
                    type="checkbox"
                    checked={Boolean(alertPreferences[key as keyof typeof alertPreferences])}
                    onChange={(e) =>
                      void updateAlertPrefs({ [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Search, Filters & Stats */}
          {displayList.length > 0 && activeTab !== "areas" && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search in your ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-ds-card-border rounded-xl focus:ring-2 focus:ring-ds-primary outline-none transition-all shadow-sm text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "for-sale", label: "For Sale" },
                  { key: "sold", label: "Sold" },
                  { key: "de-listed", label: "De-listed" },
                ].map((x) => (
                  <button
                    key={x.key}
                    onClick={() =>
                      setStatusFilter(
                        x.key as "all" | "for-sale" | "sold" | "de-listed",
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${statusFilter === x.key ? "border-ds-primary bg-ds-primary/10 text-ds-primary" : "border-ds-card-border text-ds-body hover:bg-gray-50"}`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
              <div className="text-xs font-medium text-ds-body italic">
                Showing {filteredProperties.length} of {displayList.length}{" "}
                properties
              </div>
            </div>
          )}

          {activeTab === "areas" && (
            <div className="mb-8 rounded-2xl border border-ds-card-border bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="Follow an area/community (e.g. Downtown Toronto)"
                  className="w-full rounded-lg border border-ds-card-border px-3 py-2 text-sm"
                />
                <button
                  onClick={() => {
                    const value = areaInput.trim();
                    if (!value) return;
                    followArea({
                      area_key: value.toLowerCase().replace(/\s+/g, "-"),
                      area_label: value,
                      area_kind: "community",
                    });
                    setAreaInput("");
                  }}
                  className="rounded-lg bg-ds-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Follow
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {followedAreas.map((area) => (
                  <div
                    key={area.area_key}
                    className="rounded-xl border border-ds-card-border p-3"
                  >
                    <p className="font-semibold text-ds-heading">{area.area_label}</p>
                    <p className="text-xs text-ds-body capitalize">{area.area_kind}</p>
                    <button
                      onClick={() => unfollowArea(area.area_key)}
                      className="mt-2 text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Grid */}
          {activeTab !== "areas" && displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-ds-card-border shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                {activeTab === "favorites" ? (
                  <Heart className="w-10 h-10 text-gray-200" />
                ) : activeTab === "toured" ? (
                  <Check className="w-10 h-10 text-gray-200" />
                ) : (
                  <Clock className="w-10 h-10 text-gray-200" />
                )}
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: colors.heading }}
              >
                {activeTab === "favorites"
                  ? "No favorites yet"
                  : activeTab === "toured"
                    ? "No toured homes yet"
                    : "Your history is empty"}
              </h2>
              <p className="text-center max-w-sm mb-10 text-ds-body">
                {activeTab === "favorites"
                  ? "Click the heart on any property to save it here for quick access later."
                  : activeTab === "toured"
                    ? "Mark listings as toured to track homes you have already visited."
                    : "Properties you view will appear here automatically so you can find them again easily."}
              </p>
              <button
                onClick={() => openInNewTab("/listing")}
                className="group flex items-center gap-2 px-8 py-3.5 bg-ds-primary text-white font-bold rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-ds-primary/20"
                style={{ backgroundColor: colors.primary }}
              >
                Discover Homes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : activeTab !== "areas" && filteredProperties.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-ds-heading mb-2">
                No results found
              </p>
              <p className="text-ds-body text-sm mb-6">
                We could not find any homes matching &quot;{searchTerm}&quot; in your{" "}
                {activeTab}.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-6 py-2 border border-ds-card-border rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Clear Search
              </button>
            </div>
          ) : activeTab !== "areas" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProperties.map((property: any) => {
                const pKey = getPropertyKey(property);
                return (
                  <div
                    key={pKey}
                    className="transform hover:-translate-y-1 transition-transform duration-300"
                  >
                    <PropertyCard
                      property={property}
                      propertyKey={pKey}
                      isLoggedIn={isLoggedIn}
                      isLocked={false}
                      isSelected={isPropertySelected(pKey)}
                      imageUrl={
                        property.media?.[0]?.media_url ||
                        property.media?.[0]?.MediaURL ||
                        property.Photos?.[0]?.PhotoURL ||
                        property.Photos?.[0] ||
                        null
                      }
                      imageLoaded={true}
                      cardLoaded={true}
                      isClicked={clickedProperty === pKey}
                      onCardClick={handlePropertyClick}
                      onMouseEnter={() => { }}
                      onQuickView={handleQuickView}
                      onImageLoad={() => { }}
                      onImageError={() => { }}
                      formatPrice={formatPrice}
                    />
                    <button
                      onClick={() => toggleToured(property)}
                      className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs font-semibold ${isToured(pKey) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-ds-card-border text-ds-body hover:bg-gray-50"}`}
                    >
                      {isToured(pKey) ? "Marked as toured" : "Mark as toured"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : followedAreas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ds-card-border bg-white p-10 text-center">
              <p className="text-ds-body">No followed areas yet.</p>
            </div>
          ) : null}
          
        </Container>
      </main>

      <Footer />

      <PropertyQuickViewModal
        show={showQuickView}
        property={quickViewProperty}
        onClose={() => setShowQuickView(false)}
      />
    </div>
  );
}
