"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { submitPropertyInquiry } from "@/lib/api";
import type { PropertyInquiryIntent, PropertyInquiryPayload } from "@/lib/api/types";
import { ChevronDown, ChevronUp, Home } from "lucide-react";

const INQUIRY_STORAGE_KEY = "property_inquiry_submissions";

interface CachedInquirySubmission {
  id: number;
  messagePreview: string;
  submittedAt: string;
}

export default function FindMyPropertyPage() {
  const { user, isLoading: authLoading } = useUserAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState<PropertyInquiryIntent>("buy");
  const [message, setMessage] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");
  const [propertyTypes, setPropertyTypes] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [bedroomsMin, setBedroomsMin] = useState("");
  const [bathroomsMin, setBathroomsMin] = useState("");
  const [timeline, setTimeline] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [lastSubmission, setLastSubmission] = useState<CachedInquirySubmission | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INQUIRY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CachedInquirySubmission[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setLastSubmission(parsed[0]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const parts = (user.name || "").trim().split(/\s+/);
    if (parts[0] && !firstName) setFirstName(parts[0]);
    if (parts.length > 1 && !lastName) setLastName(parts.slice(1).join(" "));
    if (user.email && !email) setEmail(user.email);
    if (user.phone && !phone) setPhone(user.phone);
  }, [authLoading, user, firstName, lastName, email, phone]);

  const isValid = useMemo(() => {
    return (
      firstName.trim().length >= 1 &&
      email.trim().length >= 3 &&
      message.trim().length >= 10
    );
  }, [firstName, email, message]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitState("idle");
    try {
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";

      const payload: PropertyInquiryPayload = {
        first_name: firstName.trim(),
        email: email.trim(),
        message: message.trim(),
        intent,
        page_url: pageUrl,
      };
      const ln = lastName.trim();
      const ph = phone.trim();
      if (ln) payload.last_name = ln;
      if (ph) payload.phone = ph;
      const pl = preferredLocations.trim();
      if (pl) payload.preferred_locations = pl;
      const pt = propertyTypes.trim();
      if (pt) payload.property_types = pt;
      const bmin = budgetMin.trim();
      const bmax = budgetMax.trim();
      if (bmin) payload.budget_min = parseInt(bmin, 10) || undefined;
      if (bmax) payload.budget_max = parseInt(bmax, 10) || undefined;
      const bd = bedroomsMin.trim();
      const bt = bathroomsMin.trim();
      if (bd) payload.bedrooms_min = parseInt(bd, 10) || undefined;
      if (bt) payload.bathrooms_min = parseInt(bt, 10) || undefined;
      const tl = timeline.trim();
      if (tl) payload.timeline = tl;

      const response = await submitPropertyInquiry(payload);

      const cached: CachedInquirySubmission = {
        id: response.id,
        messagePreview: message.trim().slice(0, 120),
        submittedAt: new Date().toISOString(),
      };
      try {
        const raw = localStorage.getItem(INQUIRY_STORAGE_KEY);
        const existing = raw ? (JSON.parse(raw) as CachedInquirySubmission[]) : [];
        const next = [cached, ...(Array.isArray(existing) ? existing : [])].slice(0, 20);
        localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }

      setLastSubmission(cached);
      setSubmitState("success");
      setMessage("");
      setPreferredLocations("");
      setPropertyTypes("");
      setBudgetMin("");
      setBudgetMax("");
      setBedroomsMin("");
      setBathroomsMin("");
      setTimeline("");
    } catch (err) {
      console.error(err);
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ds-primary/10 text-ds-primary mx-auto">
                <Home className="w-7 h-7" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-ds-heading tracking-tight">
                Find My Home
              </h1>
              <p className="text-ds-body text-base md:text-lg">
                Tell our realtor exactly what you&apos;re looking for in your own words. We&apos;ll
                save your request and follow up with you.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-ds-card-border shadow-sm p-6 md:p-8">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      required
                      className="rounded-lg border-ds-card-border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                      Last name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="rounded-lg border-ds-card-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="rounded-lg border-ds-card-border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                      Phone
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Optional"
                      className="rounded-lg border-ds-card-border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                    What are you looking for? <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="E.g. 3-bed detached under $1.2M near good schools in Mississauga, move-in within 6 months…"
                    rows={6}
                    required
                    className="rounded-lg border-ds-card-border resize-y min-h-[140px]"
                  />
                  <p className="text-xs text-ds-body mt-1.5">Minimum 10 characters.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm font-semibold text-ds-primary hover:opacity-90"
                >
                  {detailsOpen ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide optional details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Add more details (optional)
                    </>
                  )}
                </button>

                {detailsOpen ? (
                  <div className="space-y-4 pt-1 border-t border-ds-card-border">
                    <div>
                      <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                        Intent
                      </label>
                      <select
                        value={intent}
                        onChange={(e) => setIntent(e.target.value as PropertyInquiryIntent)}
                        className="w-full rounded-lg border border-ds-card-border px-3 py-2 text-sm bg-white"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                        <option value="rent">Rent</option>
                        <option value="explore">Just exploring</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                        Preferred locations
                      </label>
                      <Input
                        value={preferredLocations}
                        onChange={(e) => setPreferredLocations(e.target.value)}
                        placeholder="Neighbourhoods, cities, or regions"
                        className="rounded-lg border-ds-card-border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                        Property types
                      </label>
                      <Input
                        value={propertyTypes}
                        onChange={(e) => setPropertyTypes(e.target.value)}
                        placeholder="Detached, condo, townhouse…"
                        className="rounded-lg border-ds-card-border"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                          Budget min ($)
                        </label>
                        <Input
                          inputMode="numeric"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 800000"
                          className="rounded-lg border-ds-card-border"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                          Budget max ($)
                        </label>
                        <Input
                          inputMode="numeric"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 1200000"
                          className="rounded-lg border-ds-card-border"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                          Min bedrooms
                        </label>
                        <Input
                          inputMode="numeric"
                          value={bedroomsMin}
                          onChange={(e) => setBedroomsMin(e.target.value.replace(/\D/g, ""))}
                          placeholder="3"
                          className="rounded-lg border-ds-card-border"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                          Min bathrooms
                        </label>
                        <Input
                          inputMode="numeric"
                          value={bathroomsMin}
                          onChange={(e) => setBathroomsMin(e.target.value.replace(/\D/g, ""))}
                          placeholder="2"
                          className="rounded-lg border-ds-card-border"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ds-heading mb-1.5">
                        Timeline
                      </label>
                      <select
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full rounded-lg border border-ds-card-border px-3 py-2 text-sm bg-white"
                      >
                        <option value="">Select…</option>
                        <option value="0-3 months">0–3 months</option>
                        <option value="3-6 months">3–6 months</option>
                        <option value="6+ months">6+ months</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {submitState === "success" ? (
                  <p className="text-sm text-green-700">
                    Thanks! We&apos;ve received your request and sent it to our realtor team.
                  </p>
                ) : null}
                {submitState === "error" ? (
                  <p className="text-sm text-red-600">
                    Something went wrong. Please try again in a moment.
                  </p>
                ) : null}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  {lastSubmission ? (
                    <p className="text-xs text-ds-body order-2 sm:order-1">
                      Last request:{" "}
                      {new Date(lastSubmission.submittedAt).toLocaleString("en-CA")}
                    </p>
                  ) : (
                    <span className="order-2 sm:order-1" />
                  )}
                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="order-1 sm:order-2 bg-ds-primary hover:opacity-90"
                  >
                    {isSubmitting ? "Sending…" : "Send to realtor"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
