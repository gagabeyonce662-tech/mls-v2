"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const FACEBOOK_OAUTH_MESSAGE_SOURCE = "facebook-oauth";

function FacebookCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const code = searchParams.get("code");
    const state = searchParams.get("state") ?? "";

    if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
      if (error) {
        window.opener.postMessage(
          {
            source: FACEBOOK_OAUTH_MESSAGE_SOURCE,
            error,
            error_description: errorDescription,
            state,
          },
          window.location.origin,
        );
      } else if (code) {
        window.opener.postMessage(
          {
            source: FACEBOOK_OAUTH_MESSAGE_SOURCE,
            code,
            state,
          },
          window.location.origin,
        );
      } else {
        window.opener.postMessage(
          {
            source: FACEBOOK_OAUTH_MESSAGE_SOURCE,
            error: "no_code",
            state,
          },
          window.location.origin,
        );
      }
    }

    window.close();
  }, [searchParams]);

  return (
    <p className="p-4 text-center text-sm text-muted-foreground">
      You can close this window.
    </p>
  );
}

export default function FacebookOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-center text-sm text-muted-foreground">Loading…</p>
      }
    >
      <FacebookCallbackContent />
    </Suspense>
  );
}
