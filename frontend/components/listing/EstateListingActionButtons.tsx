"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, FileText, Loader2, Lock } from "lucide-react";
import type { Property } from "@/lib/api";
import {
  normalizeListingActionButtons,
  type ListingActionButton,
} from "@/lib/propertyUtils";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { trackEstateListingButtonClick } from "@/lib/api/listingButtons";
import PhoneVerificationModal from "@/components/listing/PhoneVerificationModal";

export default function EstateListingActionButtons({
  property,
}: {
  property: Property;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, refreshProfile } = useUserAuth();
  const [pendingButton, setPendingButton] = useState<ListingActionButton | null>(
    null,
  );
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const buttons = useMemo(
    () =>
      normalizeListingActionButtons(
        (property as Record<string, unknown>).listing_buttons_json,
      ),
    [property],
  );

  if (buttons.length === 0) return null;

  const listingKey = String(
    property.listing_key || property.ListingKey || property.PropertyKey || "",
  );
  const estatePropertyId =
    (property as Record<string, unknown>).id ||
    String(listingKey).replace(/^estate_/i, "");

  const openTrackedButton = async (button: ListingActionButton) => {
    setError("");
    setLoadingButtonId(button.id);
    try {
      const response = await trackEstateListingButtonClick({
        estatePropertyId: estatePropertyId as string | number,
        listingKey,
        buttonId: button.id,
      });
      const href = response.href || button.href;
      window.location.assign(href);
      setPendingButton(null);
    } catch (err: any) {
      const message = String(err?.message || "");
      if (message.includes("phone_verification_required")) {
        setPendingButton(button);
      } else if (message.includes("API_ERROR:401")) {
        router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      } else {
        setError("Unable to open this link right now. Please try again.");
      }
    } finally {
      setLoadingButtonId(null);
    }
  };

  const handleClick = (button: ListingActionButton) => {
    if (isLoading) return;
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (button.requiresPhoneVerification && !user.phone_verified) {
      setPendingButton(button);
      return;
    }
    void openTrackedButton(button);
  };

  const handleVerified = async () => {
    await refreshProfile();
    if (pendingButton) {
      void openTrackedButton(pendingButton);
    }
  };

  return (
    <section className="mb-10 bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-2xl md:text-3xl font-bold text-ds-heading mb-4">
        Listing Documents
      </h2>
      <div className="flex flex-wrap gap-3">
        {buttons.map((button) => {
          const isBusy = loadingButtonId === button.id;
          return (
            <button
              key={button.id}
              type="button"
              onClick={() => handleClick(button)}
              disabled={isBusy || isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-ds-card-border bg-white px-4 py-2.5 text-sm font-semibold text-ds-heading shadow-sm transition-colors hover:bg-ds-card disabled:opacity-60"
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : button.requiresPhoneVerification ? (
                <Lock className="h-4 w-4 text-ds-primary" aria-hidden />
              ) : (
                <FileText className="h-4 w-4 text-ds-primary" aria-hidden />
              )}
              <span>{button.label}</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {pendingButton ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPendingButton(null)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white px-2 py-1 text-xs font-bold shadow"
              aria-label="Close phone verification"
            >
              X
            </button>
            <PhoneVerificationModal onVerified={handleVerified} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
