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
  const [pendingButton, setPendingButton] =
    useState<ListingActionButton | null>(null);
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
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.65)] sm:p-8">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ds-primary">
          Resources
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Plans and documents
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Open the available price lists, brochures and floor-plan documents.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {buttons.map((button) => {
          const isBusy = loadingButtonId === button.id;
          return (
            <button
              key={button.id}
              type="button"
              onClick={() => handleClick(button)}
              disabled={isBusy || isLoading}
              className="group flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm disabled:opacity-60"
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : button.requiresPhoneVerification ? (
                <Lock className="h-4 w-4 text-ds-primary" aria-hidden />
              ) : (
                <FileText className="h-4 w-4 text-ds-primary" aria-hidden />
              )}
              <span className="min-w-0 flex-1">{button.label}</span>
              <ExternalLink
                className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-ds-primary"
                aria-hidden
              />
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
