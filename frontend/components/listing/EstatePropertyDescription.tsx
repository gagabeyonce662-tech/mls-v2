"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchAPI } from "@/lib/api/client";

type EstateCtaButton = {
  label?: string;
  url?: string;
  requires_phone_auth?: boolean;
  type?: string;
  open_in_new_tab?: boolean;
  order?: number;
};

const DRIVE_HOST_RE = /(^|\.)drive\.google\.com$/i;

function isDriveLink(href: string): boolean {
  try {
    const url = new URL(href, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return DRIVE_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

function buildLockedRedirect(pathname: string, searchParams: URLSearchParams, href: string) {
  const nextUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  return `/sign-in?next=${encodeURIComponent(nextUrl)}&unlock=${encodeURIComponent(href)}`;
}

export default function EstatePropertyDescription({
  html,
  ctaButtons = [],
  estatePropertyId = null,
  className = "",
}: {
  html: string;
  ctaButtons?: EstateCtaButton[];
  estatePropertyId?: string | number | null;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUserAuth();
  const { toast } = useToast();
  const hasPhone = Boolean(user?.phone && String(user.phone).trim());
  const unlock = searchParams.get("unlock") || "";
  const openedUnlockRef = useRef<string>("");

  const safeHtml = useMemo(() => html || "", [html]);
  const safeButtons = useMemo(() => {
    if (!Array.isArray(ctaButtons)) return [];
    return ctaButtons
      .filter(Boolean)
      .map((button, index) => ({
        label: String(button.label ?? "").trim(),
        url: String(button.url ?? "").trim(),
        requires_phone_auth: Boolean(button.requires_phone_auth),
        type: String(button.type ?? "external").trim() || "external",
        open_in_new_tab: button.open_in_new_tab !== false,
        order: Number.isFinite(Number(button.order)) ? Number(button.order) : index + 1,
      }))
      .filter((button) => button.label || button.url)
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }, [ctaButtons]);

  const openUrl = (url: string, openInNewTab: boolean) => {
    if (typeof window === "undefined") return;
    if (openInNewTab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(url);
    }
  };

  const resolvePhoneLockedUrl = async (buttonIndex: number, openInNewTab: boolean) => {
    if (!estatePropertyId) {
      toast({
        title: "Download unavailable",
        description: "This listing is missing the button resolver configuration.",
      });
      return;
    }

    try {
      const popup =
        openInNewTab && typeof window !== "undefined"
          ? window.open("about:blank", "_blank", "noopener,noreferrer")
          : null;
      const result = await fetchAPI<{
        url: string;
        open_in_new_tab?: boolean;
      }>(
        `${API_BASE_URL}/api/mls/estate-properties/${encodeURIComponent(String(estatePropertyId))}/cta/resolve/`,
        {
          method: "POST",
          body: JSON.stringify({ button_index: buttonIndex }),
        },
      );
      const shouldOpenInNewTab = result.open_in_new_tab !== false;
      if (shouldOpenInNewTab && popup) {
        popup.location.href = result.url;
      } else if (shouldOpenInNewTab) {
        openUrl(result.url, true);
      } else {
        if (popup) popup.close();
        openUrl(result.url, false);
      }
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.includes("403")) {
        toast({
          title: "Phone access required",
          description: "Sign in with a phone number to unlock this button.",
        });
        router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
        return;
      }

      toast({
        title: "Unable to open download",
        description: "Please try again in a moment.",
      });
    }
  };

  useEffect(() => {
    if (!unlock || !hasPhone) return;
    if (openedUnlockRef.current === unlock) return;
    openedUnlockRef.current = unlock;

    if (typeof window !== "undefined") {
      window.open(unlock, "_blank", "noopener,noreferrer");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("unlock");
    const nextQuery = nextParams.toString();
    router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`);
  }, [hasPhone, unlock, pathname, router, searchParams]);

  const handleCtaClick = async (button: EstateCtaButton, index: number) => {
    if (button.requires_phone_auth) {
      if (!hasPhone) {
        toast({
          title: "Phone access required",
          description: "Sign in with a phone number to unlock this button.",
        });
        router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
        return;
      }

      await resolvePhoneLockedUrl(index, button.open_in_new_tab !== false);
      return;
    }

    if (!button.url) {
      toast({
        title: "Link unavailable",
        description: "This button does not have a destination yet.",
      });
      return;
    }

    openUrl(button.url, button.open_in_new_tab !== false);
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.href;
    if (!href || !isDriveLink(href)) return;

    if (hasPhone) return;

    event.preventDefault();
    event.stopPropagation();

    toast({
      title: "Phone access required",
      description: "Sign in with a phone number to unlock floor plans.",
    });

    router.push(buildLockedRedirect(pathname, searchParams as unknown as URLSearchParams, href));
  };

  return (
    <div className={className}>
      <div
        className="prose max-w-none prose-headings:scroll-mt-24"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      {safeButtons.length > 0 ? (
        <div className="border-t border-gray-200 mt-6 pt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Project Resources
          </h3>
          <div className="flex flex-wrap gap-3">
            {safeButtons.map((button, index) => {
              const buttonLabel = button.label || `Button ${index + 1}`;
              return (
                <button
                  key={`${buttonLabel}-${index}`}
                  type="button"
                  onClick={() => void handleCtaClick(button, index)}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    button.requires_phone_auth
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {buttonLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
