"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api/client";
import { useUserAuth } from "@/contexts/UserAuthContext";

type State = "loading" | "success" | "expired" | "invalid";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useUserAuth();
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("invalid");
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/verify-email/${token}/`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          // Store tokens and set user from the auto-login response
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          localStorage.setItem("user_session", JSON.stringify(data.user));
          setState("success");
          setTimeout(() => router.push("/"), 2500);
        } else if (res.status === 410) {
          setState("expired");
        } else {
          setState("invalid");
        }
      })
      .catch(() => setState("invalid"));
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {state === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-ds-primary mx-auto" />
            <h1 className="text-2xl font-bold text-ds-heading">Verifying your email…</h1>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-ds-heading">Email verified!</h1>
            <p className="text-ds-body">Your account is active. Taking you home…</p>
          </>
        )}

        {state === "expired" && (
          <>
            <Clock className="w-14 h-14 text-amber-500 mx-auto" />
            <h1 className="text-2xl font-bold text-ds-heading">Link expired</h1>
            <p className="text-ds-body">
              This verification link is no longer valid. Request a new one from the sign-in page.
            </p>
            <Button onClick={() => router.push("/sign-in")} className="w-full">
              Back to sign in
            </Button>
          </>
        )}

        {state === "invalid" && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-ds-heading">Invalid link</h1>
            <p className="text-ds-body">
              This link is invalid or has already been used.
            </p>
            <Button onClick={() => router.push("/sign-in")} className="w-full">
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
