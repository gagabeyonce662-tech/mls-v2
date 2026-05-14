"use client";

import React, { useRef } from "react";
import { Phone, ShieldCheck, Loader2, RotateCcw } from "lucide-react";
import { useUserAuth } from "@/contexts/UserAuthContext";

export default function PhoneVerificationModal() {
  const { sendOtp, verifyOtp } = useUserAuth();

  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSend = async () => {
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone.trim());
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
      await verifyOtp(phone.trim(), code);
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
            <p className="text-sm text-ds-body">We'll send a one-time code to confirm it's you</p>
          </div>
          <div className="w-full space-y-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="+1 (416) 555-0100"
              className="w-full rounded-xl border border-ds-card-border px-4 py-2.5 text-sm text-ds-heading placeholder:text-ds-body/50 outline-none focus:border-ds-primary transition-colors"
            />
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
            <p className="text-sm text-ds-body">Sent to {phone}</p>
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
