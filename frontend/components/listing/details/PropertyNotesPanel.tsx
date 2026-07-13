"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { ds } from "@/lib/design-system-utils";
import Link from "next/link";

export default function PropertyNotesPanel({
  listingKey,
  title = "My notes",
}: {
  listingKey: string;
  title?: string;
}) {
  const { user, isLoading } = useUserAuth();
  const [body, setBody] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeader = useCallback((): Record<string, string> => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("access_token")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    if (!user || !listingKey) return;
    setLoading(true);
    setError(null);
    const base = API_BASE_URL.replace(/\/+$/, "");
    fetch(
      `${base}/api/mls/property-notes/?listing_key=${encodeURIComponent(listingKey)}`,
      { headers: { ...authHeader() } },
    )
      .then((r) => {
        if (!r.ok) throw new Error("load");
        return r.json();
      })
      .then((d) => {
        setBody(String(d.body ?? ""));
        setSavedAt(d.updated_at ? String(d.updated_at) : null);
      })
      .catch(() => setError("Could not load notes."))
      .finally(() => setLoading(false));
  }, [user, listingKey, authHeader]);

  const formattedSavedAt = (() => {
    if (!savedAt) return null;
    const parsed = new Date(savedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  })();

  const save = () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const base = API_BASE_URL.replace(/\/+$/, "");
    fetch(`${base}/api/mls/property-notes/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({ listing_key: listingKey, body }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("save");
        return r.json();
      })
      .then((d) => {
        setSavedAt(d.updated_at ? String(d.updated_at) : null);
      })
      .catch(() => setError("Could not save notes."))
      .finally(() => setSaving(false));
  };

  if (isLoading) return null;

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.6)]">
        <h2 className={`${ds.h3} mb-2`}>{title}</h2>
        <p className="text-sm text-ds-body mb-3">
          Sign in to save private notes for this listing.
        </p>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-ds-primary hover:underline"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.6)]">
      <h2 className={`${ds.h3} mb-2`}>{title}</h2>
      <p className="text-xs text-ds-body mb-3">
        Visible only to your account. Not shared with listing agents.
      </p>
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      <textarea
        className="w-full min-h-[120px] rounded-xl border border-ds-card-border bg-ds-card/30 p-3 text-sm text-ds-heading"
        value={body}
        disabled={loading}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Private thoughts, questions, follow-ups…"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="rounded-lg bg-ds-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {formattedSavedAt ? (
          <span className="text-xs text-slate-500">
            Saved {formattedSavedAt}
          </span>
        ) : null}
      </div>
    </section>
  );
}
