"use client";

import React, { useRef } from "react";
import { Phone, ShieldCheck, Loader2, RotateCcw } from "lucide-react";
import { useUserAuth } from "@/contexts/UserAuthContext";

const COUNTRIES = [
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
] as const;

const TIMEZONE_COUNTRIES: Record<string, string> = {
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "Europe/London": "GB",
  "Asia/Kolkata": "IN",
  "Australia/Sydney": "AU",
  "Asia/Dubai": "AE",
};

function detectCountryCode(): string {
  const timeZoneCountry =
    TIMEZONE_COUNTRIES[Intl.DateTimeFormat().resolvedOptions().timeZone];
  if (timeZoneCountry) return timeZoneCountry;

  const locales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region;
      if (region && COUNTRIES.some((country) => country.code === region)) {
        return region;
      }
    } catch {
      // Ignore malformed browser locales and fall back to the time zone.
    }
  }

  return "CA";
}

function toInternationalPhoneNumber(localNumber: string, dialCode: string) {
  const trimmed = localNumber.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  return `${dialCode}${trimmed.replace(/\D/g, "")}`;
}

export default function PhoneVerificationModal({
  onVerified,
}: {
  onVerified?: () => void;
}) {
  const { sendOtp, verifyOtp } = useUserAuth();

  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("CA");
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    setCountryCode(detectCountryCode());
  }, []);

  const selectedCountry =
    COUNTRIES.find((country) => country.code === countryCode) || COUNTRIES[0];
  const internationalPhone = toInternationalPhoneNumber(
    phone,
    selectedCountry.dialCode,
  );

  const handleSend = async () => {
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(internationalPhone);
      setStep("otp");
    } catch (e: any) {
      setError(e?.message || "Failed to send code. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(internationalPhone, code);
      onVerified?.();
      // verifyOtp refreshes the profile — GalleryGateWrapper re-renders automatically
    } catch (e: any) {
      setError(e?.message || "Invalid or expired code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 max-w-xs w-full mx-4 border border-white/60">
      {step === "phone" ? (
        <>
          <div className="w-14 h-14 rounded-full bg-ds-primary/10 flex items-center justify-center">
            <Phone className="w-7 h-7 text-ds-primary" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-base font-semibold text-ds-heading">Verify your number</p>
            <p className="text-sm text-ds-body">
              We&apos;ll send a one-time code to confirm it&apos;s you
            </p>
          </div>
          <div className="w-full space-y-2">
            <div className="flex overflow-hidden rounded-xl border border-ds-card-border bg-white transition-colors focus-within:border-ds-primary">
              <label className="sr-only" htmlFor="phone-country-code">
                Country code
              </label>
              <select
                id="phone-country-code"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="w-28 border-r border-ds-card-border bg-slate-50 px-2 text-sm text-ds-heading outline-none"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name} ({country.dialCode})
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="phone-number">
                Phone number
              </label>
              <input
                id="phone-number"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="(416) 555-0100"
                className="min-w-0 flex-1 px-3 py-2.5 text-sm text-ds-heading placeholder:text-ds-body/50 outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full rounded-xl bg-ds-primary text-white py-2.5 text-sm font-semibold hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Code"}
          </button>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-ds-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-ds-primary" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-base font-semibold text-ds-heading">Enter the code</p>
            <p className="text-sm text-ds-body">Sent to {internationalPhone}</p>
          </div>
          <div className="flex gap-2 w-full justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-10 h-12 rounded-xl border border-ds-card-border text-center text-lg font-semibold text-ds-heading outline-none focus:border-ds-primary transition-colors"
              />
            ))}
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join("").length < 6}
            className="w-full rounded-xl bg-ds-primary text-white py-2.5 text-sm font-semibold hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
          </button>
          <button
            onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
            className="flex items-center gap-1.5 text-xs text-ds-body hover:text-ds-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Wrong number? Re-enter
          </button>
        </>
      )}
    </div>
  );
}
