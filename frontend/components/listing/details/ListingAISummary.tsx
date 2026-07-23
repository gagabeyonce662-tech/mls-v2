"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Property } from "@/lib/api/types";
import { ds } from "@/lib/design-system-utils";
import { useUserAuth } from "@/contexts/UserAuthContext";

interface ListingAISummaryProps {
  property: Property;
}

export default function ListingAISummary({ property }: ListingAISummaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: isAuthLoading } = useUserAuth();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryMarkdown, setSummaryMarkdown] = useState<string>(
    property.ai_summary_markdown || "",
  );
  const [summaryError, setSummaryError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    property.ai_summary_updated_at || null,
  );

  const listingKey = useMemo(
    () => String(property.listing_key || property.PropertyKey || "").trim(),
    [property],
  );

  const handleGenerateSummary = async () => {
    setSummaryError("");
    if (!listingKey) {
      setSummaryError("Listing key is missing for this property.");
      return;
    }

    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const token = window.localStorage.getItem("access_token");
    if (!token) {
      setSummaryError("Your sign-in session has expired. Please sign in again.");
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await fetch("/api/ai/listing-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_key: listingKey,
          force: Boolean(summaryMarkdown),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate summary");
      }

      setSummaryMarkdown(data.summary || "");
      setLastUpdated(data.updated_at || null);
    } catch (err: any) {
      setSummaryError(err?.message || "Could not generate summary right now.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className={ds.h3}>AI Listing Summary</h2>
        <button
          type="button"
          onClick={handleGenerateSummary}
          disabled={isSummarizing || isAuthLoading}
          className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-60"
        >
          {isSummarizing
            ? "Generating..."
            : !user
              ? "Sign in to generate"
              : summaryMarkdown
                ? "Regenerate summary"
                : "Generate summary"}
        </button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-ds-body mb-3">
          AI-generated from current listing data · Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}

      {summaryError ? (
        <p className="text-sm text-red-600 font-medium">{summaryError}</p>
      ) : summaryMarkdown ? (
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {summaryMarkdown}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm text-ds-body">
          Generate a decision brief with confirmed facts, costs and conditions, details to verify, and questions to ask.
        </p>
      )}
    </section>
  );
}
