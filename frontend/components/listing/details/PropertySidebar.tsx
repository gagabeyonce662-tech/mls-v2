"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Columns,
  Check,
  Heart,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useCompare } from "@/contexts/CompareContext";
import { useWatched } from "@/contexts/WatchedContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { submitPropertyInquiry, type PropertyInquiryIntent } from "@/lib/api";
import { fetchWatchedAlertPreview } from "@/lib/api/properties";
import { env } from "@/lib/env";
import { getDetailUrl } from "@/lib/propertyUtils";
import {
  getDisplayAddress,
  getDisplayPriceLabel,
  getListingIsPrivileged,
  getMlsNumberForDisplay,
} from "@/lib/listingDisplay";

interface PropertySidebarProps {
  property: any;
  city: string;
}

export default function PropertySidebar({
  property,
  city,
}: PropertySidebarProps) {
  const { user, isLoading: authLoading } = useUserAuth();
  const lat = property.latitude;
  const lon = property.longitude;
  const {
    addToCompare,
    removeFromCompare,
    isPropertySelected,
    getPropertyKey,
  } = useCompare();
  const { toggleFavorite, isFavorite, updateAlertPrefs, alertPreferences } = useWatched();

  const propertyKey = getPropertyKey(property);
  const isSelected = isPropertySelected(propertyKey);
  const isSaved = isFavorite(propertyKey);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquiryState, setInquiryState] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [shareStatus, setShareStatus] = useState<"" | "copied" | "shared" | "failed">(
    "",
  );
  const [alertPreviewText, setAlertPreviewText] = useState("");

  const inferredIntent = useMemo<PropertyInquiryIntent>(() => {
    const leaseAmount = Number(property?.lease_amount ?? 0);
    return leaseAmount > 0 ? "rent" : "buy";
  }, [property?.lease_amount]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (!firstName) {
      const namePart = (user.name || "").trim().split(/\s+/)[0] || "";
      if (namePart) setFirstName(namePart);
    }
    if (!email && user.email) setEmail(user.email);
    if (!phone && user.phone) setPhone(user.phone);
  }, [authLoading, user, firstName, email, phone]);

  useEffect(() => {
    if (message.trim()) return;
    const isPrivileged = getListingIsPrivileged();
    const address = getDisplayAddress(property, { isPrivileged });
    const priceLabel = getDisplayPriceLabel(property, { isPrivileged });
    const mls = getMlsNumberForDisplay(property, { isPrivileged });
    const details = [
      address ? `Location: ${address}` : null,
      priceLabel ? `Price: ${priceLabel}` : null,
      mls ? `MLS® #: ${mls}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
    setMessage(
      `Hi, I'm interested in this property and would like more details and viewing availability.${details ? `\n\n${details}` : ""}`,
    );
  }, [message, property, propertyKey]);

  const canSubmitInquiry =
    firstName.trim().length > 0 && email.trim().length > 2 && message.trim().length >= 10;

  const handleInquirySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitInquiry || isSubmittingInquiry) return;

    setIsSubmittingInquiry(true);
    setInquiryState("idle");
    try {
      const payload = {
        first_name: firstName.trim(),
        email: email.trim(),
        message: message.trim(),
        intent: inferredIntent,
        phone: phone.trim() || undefined,
        preferred_locations: city || property?.city || undefined,
        property_types: property?.property_sub_type || property?.PropertySubType || undefined,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
      };
      await submitPropertyInquiry(payload);
      setInquiryState("success");
    } catch (error) {
      console.error("Property inquiry submit failed", error);
      setInquiryState("error");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleShare = async () => {
    const detailUrl = getDetailUrl(property);
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${detailUrl}`
        : detailUrl;
    const shareAddress = getDisplayAddress(property, {
      isPrivileged: getListingIsPrivileged(),
    });
    const shareTitle = `${shareAddress} | Estate-4u`;
    const shareText = `Check out this property on Estate-4u.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus("shared");
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("copied");
        return;
      }

      if (typeof window !== "undefined") {
        window.prompt("Copy this link:", shareUrl);
        setShareStatus("copied");
        return;
      }

      setShareStatus("failed");
    } catch (error) {
      console.error("Share failed", error);
      setShareStatus("failed");
    }
  };

  useEffect(() => {
    if (!shareStatus) return;
    const timer = window.setTimeout(() => setShareStatus(""), 2500);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  const scheduleUrl = env.NEXT_PUBLIC_SCHEDULE_VIEWING_URL || "";

  const enableAlerts = async () => {
    await updateAlertPrefs({
      email_enabled: true,
      price_changes: true,
      status_updates: true,
    });
    const preview = await fetchWatchedAlertPreview(14);
    if (preview?.events?.length) {
      setAlertPreviewText(`${preview.events.length} alert-worthy update(s) in last ${preview.window_days || 14} days.`);
    } else if (preview?.message) {
      setAlertPreviewText(preview.message);
    } else {
      setAlertPreviewText("Alerts are enabled. You'll receive updates when watched listings change.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Interested? CTA — primary lead-gen goal, topmost */}
      <div className="bg-ds-primary text-white rounded-xl p-6 shadow-xl shadow-ds-primary/10">
        <h3 className="text-lg font-bold mb-2 text-white ">Interested?</h3>
        <p className="text-sm text-white/80 mb-6">
          Get in touch with an expert about this property.
        </p>
        {!isInquiryOpen ? (
          <div className="space-y-2">
            <button
              onClick={() => setIsInquiryOpen(true)}
              className="w-full py-3 bg-white text-ds-primary font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Request Information
            </button>
            {scheduleUrl ? (
              <a
                href={scheduleUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center py-3 bg-white/15 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/25 transition-colors"
              >
                Schedule a Viewing
              </a>
            ) : null}
            <button
              onClick={enableAlerts}
              className="w-full py-3 bg-white/15 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/25 transition-colors"
            >
              {alertPreferences.email_enabled ? "Alerts Enabled" : "Notify Me"}
            </button>
            {alertPreviewText ? (
              <p className="text-[11px] text-white/85">{alertPreviewText}</p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleInquirySubmit} className="space-y-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              className="w-full rounded-lg border border-white/40 bg-white/95 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-white/70"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-lg border border-white/40 bg-white/95 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-white/70"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full rounded-lg border border-white/40 bg-white/95 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-white/70"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              className="w-full rounded-lg border border-white/40 bg-white/95 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-white/70 resize-y"
            />

            {inquiryState === "success" ? (
              <p className="text-xs text-green-100">
                Thanks! Your request has been sent to our realtor team.
              </p>
            ) : null}
            {inquiryState === "error" ? (
              <p className="text-xs text-red-100">
                We couldn't send your request. Please try again.
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!canSubmitInquiry || isSubmittingInquiry}
                className="flex-1 py-2.5 bg-white text-ds-primary font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmittingInquiry ? "Sending..." : "Send Request"}
              </button>
              <button
                type="button"
                onClick={() => setIsInquiryOpen(false)}
                className="px-3 py-2.5 border border-white/60 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Map Section */}
      <div className="bg-ds-card border border-ds-card-border rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-ds-heading mb-4">Location</h3>
        <div className="h-64 rounded-lg overflow-hidden border border-ds-card-border relative bg-gray-100">
          {lat && lon ? (
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon) - 0.005},${parseFloat(lat) - 0.005},${parseFloat(lon) + 0.005},${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat},${lon}`}
              style={{ border: "none" }}
            ></iframe>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <MapPin className="w-8 h-8 text-ds-body opacity-30 mb-2" />
              <p className="text-sm text-ds-body">
                Location details pinning...
              </p>
              <p className="text-xs text-ds-body/70 mt-1">
                {city}, {property.StateOrProvince || "Ontario"}
              </p>
            </div>
          )}
        </div>
        {lat && lon && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold bg-gray-50 border border-ds-card-border rounded-lg hover:bg-white hover:shadow-sm transition-all text-ds-body"
            >
              <Navigation className="w-3 h-3 text-ds-primary" />
              Google Maps
            </a>
            <Link
              href={`/map-search?lat=${lat}&lng=${lon}&zoom=15${
                property?.listing_key
                  ? `&id=${encodeURIComponent(property.listing_key)}`
                  : ""
              }`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold bg-gray-50 border border-ds-card-border rounded-lg hover:bg-white hover:shadow-sm transition-all text-ds-body"
            >
              <ExternalLink className="w-3 h-3 text-ds-primary" />
              Explore Area
            </Link>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-[10px] text-ds-body font-mono">
          <MapPin className="w-3 h-3" />
          {lat && lon ? (
            <span>
              {lat}, {lon}
            </span>
          ) : (
            <span>Coordinates not available</span>
          )}
        </div>
      </div>

      {/* Secondary actions */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ds-body/70">
          More actions
        </p>
        <div className="flex gap-2">
        <button
          onClick={() =>
            isSelected ? removeFromCompare(propertyKey) : addToCompare(property)
          }
          className={`flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-bold border rounded-xl transition-all ${isSelected
              ? "bg-blue-50 border-blue-200 text-blue-700 shadow-inner"
              : "bg-white border-ds-card-border text-ds-body/90 hover:bg-gray-50 shadow-sm"
            }`}
        >
          {isSelected ? (
            <Check className="w-4 h-4 mb-1" />
          ) : (
            <Columns className="w-4 h-4 mb-1" />
          )}
          {isSelected ? "Added" : "Compare"}
        </button>
        <button
          onClick={() => toggleFavorite(property)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-bold border rounded-xl transition-all ${isSaved
              ? "bg-red-50 border-red-200 text-red-600 shadow-inner"
              : "bg-white border-ds-card-border text-ds-body/90 hover:bg-gray-50 shadow-sm"
            }`}
        >
          <Heart className={`w-4 h-4 mb-1 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          onClick={handleShare}
          aria-label="Share listing"
          className="flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-bold bg-white border border-ds-card-border rounded-xl text-ds-body/90 hover:bg-gray-50 shadow-sm transition-all"
        >
          <Share2 className="w-4 h-4 mb-1" />
          Share
        </button>
      </div>
      </div>
      {shareStatus ? (
        <p className="text-[11px] text-ds-body">
          {shareStatus === "shared"
            ? "Shared successfully."
            : shareStatus === "copied"
              ? "Link copied to clipboard."
              : "Could not share right now."}
        </p>
      ) : null}
    </div>
  );
}
