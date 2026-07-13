"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useWatched } from "@/contexts/WatchedContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { submitPropertyInquiry, type PropertyInquiryIntent } from "@/lib/api";
import { fetchWatchedAlertPreview } from "@/lib/api/properties";
import { env } from "@/lib/env";
import {
  getDisplayAddress,
  getDisplayPriceLabel,
  getListingIsPrivileged,
  getMlsNumberForDisplay,
} from "@/lib/listingDisplay";
import ListingQuickActions from "@/components/listing/details/ListingQuickActions";

interface PropertySidebarProps {
  property: any;
  city: string;
  showLocationMap?: boolean;
  showSecondaryActions?: boolean;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  showTrustPoints?: boolean;
}

export default function PropertySidebar({
  property,
  city,
  showLocationMap = true,
  showSecondaryActions = true,
  title = "Interested?",
  description = "Get in touch with an expert about this property.",
  primaryActionLabel = "Request Information",
  showTrustPoints = false,
}: PropertySidebarProps) {
  const { user, isLoading: authLoading } = useUserAuth();
  const lat = property.latitude;
  const lon = property.longitude;
  const { updateAlertPrefs, alertPreferences } = useWatched();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquiryState, setInquiryState] = useState<
    "idle" | "success" | "error"
  >("idle");
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
  }, [message, property]);

  const canSubmitInquiry =
    firstName.trim().length > 0 &&
    email.trim().length > 2 &&
    message.trim().length >= 10;

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
        property_types:
          property?.property_sub_type || property?.PropertySubType || undefined,
        page_url:
          typeof window !== "undefined" ? window.location.href : undefined,
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

  const scheduleUrl = env.NEXT_PUBLIC_SCHEDULE_VIEWING_URL || "";

  const enableAlerts = async () => {
    await updateAlertPrefs({
      email_enabled: true,
      price_changes: true,
      status_updates: true,
      email_recommend: true,
      email_watched_property: true,
      email_watched_community: true,
      email_watched_area: true,
      push_watched_property: true,
    });
    const preview = await fetchWatchedAlertPreview(14);
    if (preview?.events?.length) {
      setAlertPreviewText(
        `${preview.events.length} alert-worthy update(s) in last ${preview.window_days || 14} days.`,
      );
    } else if (preview?.message) {
      setAlertPreviewText(preview.message);
    } else {
      setAlertPreviewText(
        "Alerts are enabled. You'll receive updates when watched listings change.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary lead-generation card */}
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173579] via-ds-primary to-[#13285f] p-7 text-white shadow-[0_24px_60px_-30px_rgba(30,58,138,0.85)]">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-100">
          Private consultation
        </p>
        <h3 className="mt-3 text-2xl font-bold leading-tight text-white">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/80">{description}</p>

        {!isInquiryOpen ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => setIsInquiryOpen(true)}
              className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-extrabold text-ds-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              {primaryActionLabel}
            </button>
            {scheduleUrl ? (
              <a
                href={scheduleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Book a consultation
              </a>
            ) : null}
            <button
              type="button"
              onClick={enableAlerts}
              className="w-full rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              {alertPreferences.email_enabled
                ? "Updates enabled"
                : "Notify me of updates"}
            </button>
            {showTrustPoints ? (
              <div className="space-y-2 border-t border-white/15 pt-4 text-xs text-white/80">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  No obligation
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Latest pricing and availability
                </p>
              </div>
            ) : null}
            {alertPreviewText ? (
              <p className="text-xs leading-5 text-white/75">
                {alertPreviewText}
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleInquirySubmit} className="mt-6 space-y-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              className="w-full rounded-xl border border-white/30 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-xl border border-white/30 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full rounded-xl border border-white/30 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              className="w-full resize-y rounded-xl border border-white/30 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
            />

            {inquiryState === "success" ? (
              <p className="rounded-lg bg-emerald-400/15 px-3 py-2 text-xs text-emerald-100">
                Thanks! Your request has been sent to our realtor team.
              </p>
            ) : null}
            {inquiryState === "error" ? (
              <p className="rounded-lg bg-red-400/15 px-3 py-2 text-xs text-red-100">
                We couldn&apos;t send your request. Please try again.
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!canSubmitInquiry || isSubmittingInquiry}
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-ds-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingInquiry ? "Sending..." : "Send request"}
              </button>
              <button
                type="button"
                onClick={() => setIsInquiryOpen(false)}
                className="rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {showLocationMap ? (
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
      ) : null}

      {showSecondaryActions ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ds-body/70">
            More actions
          </p>
          <ListingQuickActions property={property} />
        </div>
      ) : null}
    </div>
  );
}
