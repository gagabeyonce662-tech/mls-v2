"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useToast } from "@/hooks/use-toast";
import { env } from "@/lib/env";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (options: {
            client_id: string;
            scope: string;
            ux_mode: "popup" | "redirect";
            callback: (response: { code?: string; error?: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInValues = z.infer<typeof signInSchema>;

const FACEBOOK_OAUTH_MESSAGE_SOURCE = "facebook-oauth";

export default function SignInPage() {
  const router = useRouter();
  const { login, googleLoginWithCode, facebookLoginWithCode } = useUserAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const isGoogleScriptReadyRef = useRef(false);
  const facebookPopupCheckRef = useRef<number | null>(null);
  const isGoogleConfigured = Boolean(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const isFacebookConfigured = Boolean(env.NEXT_PUBLIC_FACEBOOK_APP_ID);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInValues) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Please check your credentials and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (window.google?.accounts?.oauth2) {
      isGoogleScriptReadyRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGoogleScriptReadyRef.current = true;
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Google Sign-In not configured",
        description:
          "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend environment.",
      });
      return;
    }

    if (!isGoogleScriptReadyRef.current || !window.google?.accounts?.oauth2) {
      toast({
        variant: "destructive",
        title: "Google Sign-In unavailable",
        description: "Google script is still loading. Please retry.",
      });
      return;
    }

    setIsGoogleLoading(true);
    try {
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response) => {
          try {
            if (response?.error) {
              throw new Error(response.error);
            }
            if (!response?.code) {
              throw new Error("No authorization code received");
            }
            await googleLoginWithCode(response.code);
            toast({
              title: "Welcome!",
              description: "You have signed in with Google.",
            });
            router.push("/");
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Google authentication failed",
              description:
                "Could not complete Google sign-in. Please try again.",
            });
          } finally {
            setIsGoogleLoading(false);
          }
        },
      });

      codeClient.requestCode();
    } catch (error) {
      setIsGoogleLoading(false);
      toast({
        variant: "destructive",
        title: "Google authentication failed",
        description: "Unable to start Google sign-in flow.",
      });
    }
  };

  const handleFacebookSignIn = useCallback(() => {
    const appId = env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) {
      toast({
        variant: "destructive",
        title: "Facebook Sign-In not configured",
        description:
          "Missing NEXT_PUBLIC_FACEBOOK_APP_ID in frontend environment.",
      });
      return;
    }

    const redirectUri = (
      env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI?.trim() ||
      `${window.location.origin}/auth/facebook/callback`
    ).trim();

    const graphVersion =
      env.NEXT_PUBLIC_FACEBOOK_GRAPH_VERSION?.trim() || "v19.0";

    const state = crypto.randomUUID();
    sessionStorage.setItem("facebook_oauth_state", state);

    const dialogUrl = `https://www.facebook.com/${graphVersion}/dialog/oauth?client_id=${encodeURIComponent(
      appId,
    )}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(
      "email,public_profile",
    )}&response_type=code`;

    const timeoutMs = 5 * 60 * 1000;
    let settled = false;
    let maxWaitId: number | null = null;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== FACEBOOK_OAUTH_MESSAGE_SOURCE) return;
      if (data.state !== sessionStorage.getItem("facebook_oauth_state")) return;

      void (async () => {
        try {
          if (data.error) {
            let desc = "";
            if (typeof data.error_description === "string") {
              try {
                desc = decodeURIComponent(
                  data.error_description.replace(/\+/g, " "),
                );
              } catch {
                desc = data.error_description;
              }
            }
            throw new Error(desc || String(data.error));
          }
          if (!data.code) {
            throw new Error("No authorization code received");
          }
          await facebookLoginWithCode(data.code, redirectUri);
          sessionStorage.removeItem("facebook_oauth_state");
          toast({
            title: "Welcome!",
            description: "You have signed in with Facebook.",
          });
          router.push("/");
        } catch {
          toast({
            variant: "destructive",
            title: "Facebook authentication failed",
            description:
              "Could not complete Facebook sign-in. Please try again.",
          });
        } finally {
          finish();
        }
      })();
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      if (maxWaitId != null) {
        window.clearTimeout(maxWaitId);
        maxWaitId = null;
      }
      window.removeEventListener("message", onMessage);
      if (facebookPopupCheckRef.current != null) {
        window.clearInterval(facebookPopupCheckRef.current);
        facebookPopupCheckRef.current = null;
      }
      setIsFacebookLoading(false);
    };

    window.addEventListener("message", onMessage);
    setIsFacebookLoading(true);

    const popup = window.open(
      dialogUrl,
      "facebook_oauth",
      "width=600,height=700,scrollbars=yes",
    );

    if (!popup) {
      finish();
      toast({
        variant: "destructive",
        title: "Popup blocked",
        description:
          "Please allow popups for this site to sign in with Facebook.",
      });
      return;
    }

    facebookPopupCheckRef.current = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(facebookPopupCheckRef.current!);
        facebookPopupCheckRef.current = null;
        window.setTimeout(() => {
          if (!settled) {
            finish();
          }
        }, 500);
      }
    }, 500);

    maxWaitId = window.setTimeout(() => {
      if (!settled) {
        finish();
        toast({
          variant: "destructive",
          title: "Facebook Sign-In timed out",
          description: "Please try again.",
        });
      }
    }, timeoutMs);
  }, [facebookLoginWithCode, router, toast]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-ds-heading">
          Welcome Back
        </h1>
        <p className="text-ds-body">
          Enter your credentials to access your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body group-focus-within:text-ds-primary transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="pl-10 h-12 transition-all border-ds-card-border focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-ds-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body group-focus-within:text-ds-primary transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="pl-10 pr-10 h-12 transition-all border-ds-card-border focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-body hover:text-ds-heading transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-semibold transition-all hover:shadow-lg active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-ds-card-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50/50 px-2 text-ds-body">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-11 border-ds-card-border hover:bg-white hover:shadow-md transition-all"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isFacebookLoading}
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Google...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="h-11 border-ds-card-border hover:bg-white hover:shadow-md transition-all"
          type="button"
          onClick={handleFacebookSignIn}
          disabled={isFacebookLoading || isGoogleLoading}
        >
          {isFacebookLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Facebook...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-1 3h-2v6.8c4.56-.93 8-4.96 8-9.8z" />
              </svg>
              Facebook
            </>
          )}
        </Button>
      </div>
      {!isGoogleConfigured ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Google login is not configured. Add{" "}
          <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to frontend env.
        </p>
      ) : null}
      {!isFacebookConfigured ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Facebook login is not configured. Add{" "}
          <code>NEXT_PUBLIC_FACEBOOK_APP_ID</code> to frontend env, and set
          matching <code>FACEBOOK_REDIRECT_URI</code> /{" "}
          <code>FACEBOOK_ALLOWED_REDIRECT_URIS</code> on the backend.
        </p>
      ) : null}

      <p className="text-center text-sm text-ds-body">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-ds-primary hover:underline transition-colors underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
