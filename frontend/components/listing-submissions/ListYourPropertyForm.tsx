"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserAuth } from "@/contexts/UserAuthContext";
import {
  createListingSubmission,
  submitListingSubmission,
  uploadListingSubmissionMedia,
  ListingSubmissionPayload,
} from "@/lib/api";

const steps = ["Property", "Location", "Details", "Review"];
type ListingSubmissionFormState = Omit<
  ListingSubmissionPayload,
  | "bedrooms"
  | "bathrooms"
  | "interior_area_sqft"
  | "asking_price"
  | "available_from"
> & {
  bedrooms: string;
  bathrooms: string;
  interior_area_sqft: string;
  asking_price: string;
  available_from: string;
};

const initial: ListingSubmissionFormState = {
  submitter_type: "owner",
  purpose: "sale",
  property_type: "Detached home",
  address_line_1: "",
  address_line_2: "",
  city: "",
  province: "ON",
  postal_code: "",
  country: "Canada",
  bedrooms: "",
  bathrooms: "",
  interior_area_sqft: "",
  asking_price: "",
  available_from: "",
  description: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  ownership_confirmed: false,
  publication_consent: false,
};

export default function ListYourPropertyForm() {
  const router = useRouter();
  const { user, isLoading } = useUserAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ListingSubmissionFormState>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user)
      setData((current) => ({
        ...current,
        contact_name: current.contact_name || user.name || "",
        contact_email: current.contact_email || user.email || "",
        contact_phone: current.contact_phone || user.phone || "",
      }));
  }, [user]);

  const update = <K extends keyof ListingSubmissionFormState>(
    name: K,
    value: ListingSubmissionFormState[K],
  ) => {
    setData((current) => ({
      ...current,
      [name]: value,
    }));
  };
  const canContinue = () => {
    if (step === 0)
      return Boolean(data.submitter_type && data.purpose && data.property_type);
    if (step === 1) return Boolean(data.address_line_1 && data.city);
    if (step === 2)
      return Boolean(
        data.asking_price &&
        data.contact_name &&
        data.contact_email &&
        data.contact_phone,
      );
    return data.ownership_confirmed && data.publication_consent;
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      router.push("/sign-in?next=/list-your-property");
      return;
    }
    if (!user.phone_verified) {
      setError(
        "Please verify your phone number from your account before submitting a listing.",
      );
      return;
    }
    if (!canContinue() || saving) return;
    setSaving(true);
    setError("");
    try {
      const payload: ListingSubmissionPayload = {
        ...data,
        bedrooms: data.bedrooms || null,
        bathrooms: data.bathrooms || null,
        interior_area_sqft: data.interior_area_sqft
          ? Number(data.interior_area_sqft)
          : null,
        asking_price: data.asking_price || null,
        available_from: data.available_from || null,
      };

      const submission = await createListingSubmission(payload);
      await Promise.all(
        files.map((file) =>
          uploadListingSubmissionMedia(submission.id, file, "photo"),
        ),
      );
      await submitListingSubmission(submission.id);
      router.push("/dashboard/listings?submitted=1");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? "We couldn’t submit the listing. " + cause.message
          : "We couldn’t submit the listing. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isLoading && !user)
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <h2 className="text-xl font-bold">Sign in to list a property</h2>
        <p className="mt-2 text-gray-600">
          Submissions are tied to a verified account and reviewed before they
          can be published.
        </p>
        <Button asChild className="mt-6">
          <Link href="/sign-in?next=/list-your-property">Sign in</Link>
        </Button>
      </div>
    );

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border bg-white p-6 shadow-sm md:p-10"
    >
      <div className="mb-8 grid grid-cols-4 gap-2">
        {steps.map((name, index) => (
          <div
            key={name}
            className={`text-center text-xs font-semibold ${index <= step ? "text-ds-primary" : "text-gray-400"}`}
          >
            <div
              className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full ${index <= step ? "bg-ds-primary text-white" : "bg-gray-100"}`}
            >
              {index < step ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {name}
          </div>
        ))}
      </div>
      {step === 0 && (
        <section className="grid gap-5 md:grid-cols-2">
          <Field label="I am listing as">
            <select
              value={data.submitter_type}
              onChange={(e) =>
                update(
                  "submitter_type",
                  e.target
                    .value as ListingSubmissionFormState["submitter_type"],
                )
              }
            >
              <option value="owner">Owner</option>
              <option value="agent">Agent</option>
              <option value="builder">Builder</option>
            </select>
          </Field>
          <Field label="Listing purpose">
            <select
              value={data.purpose}
              onChange={(e) =>
                update(
                  "purpose",
                  e.target.value as ListingSubmissionFormState["purpose"],
                )
              }
            >
              <option value="sale">For sale</option>
              <option value="rent">For rent</option>
            </select>
          </Field>
          <Field label="Property type">
            <Input
              value={data.property_type}
              onChange={(e) => update("property_type", e.target.value)}
              placeholder="Condo, townhome, detached…"
            />
          </Field>
        </section>
      )}
      {step === 1 && (
        <section className="grid gap-5 md:grid-cols-2">
          <Field label="Street address">
            <Input
              required
              value={data.address_line_1}
              onChange={(e) => update("address_line_1", e.target.value)}
            />
          </Field>
          <Field label="Unit / suite (optional)">
            <Input
              value={data.address_line_2}
              onChange={(e) => update("address_line_2", e.target.value)}
            />
          </Field>
          <Field label="City">
            <Input
              required
              value={data.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </Field>
          <Field label="Province">
            <Input
              value={data.province}
              onChange={(e) => update("province", e.target.value)}
            />
          </Field>
          <Field label="Postal code">
            <Input
              value={data.postal_code}
              onChange={(e) => update("postal_code", e.target.value)}
            />
          </Field>
        </section>
      )}
      {step === 2 && (
        <section className="grid gap-5 md:grid-cols-2">
          <Field label="Asking price">
            <Input
              required
              type="number"
              min="0"
              value={data.asking_price}
              onChange={(e) => update("asking_price", e.target.value)}
            />
          </Field>
          <Field label="Available from">
            <Input
              type="date"
              value={data.available_from}
              onChange={(e) => update("available_from", e.target.value)}
            />
          </Field>
          <Field label="Bedrooms">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={data.bedrooms}
              onChange={(e) => update("bedrooms", e.target.value)}
            />
          </Field>
          <Field label="Bathrooms">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={data.bathrooms}
              onChange={(e) => update("bathrooms", e.target.value)}
            />
          </Field>
          <Field label="Interior area (sq. ft.)">
            <Input
              type="number"
              min="0"
              value={data.interior_area_sqft}
              onChange={(e) => update("interior_area_sqft", e.target.value)}
            />
          </Field>
          <Field label="Photos, floor plans or documents">
            <Input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []).slice(0, 25))
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Up to 25 JPEG, PNG, WebP, or PDF files; 15 MB each.
            </p>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Tell reviewers about the property."
              />
            </Field>
          </div>
          <Field label="Contact name">
            <Input
              required
              value={data.contact_name}
              onChange={(e) => update("contact_name", e.target.value)}
            />
          </Field>
          <Field label="Contact email">
            <Input
              required
              type="email"
              value={data.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
            />
          </Field>
          <Field label="Contact phone">
            <Input
              required
              type="tel"
              value={data.contact_phone}
              onChange={(e) => update("contact_phone", e.target.value)}
            />
          </Field>
        </section>
      )}
      {step === 3 && (
        <section className="space-y-5">
          <div className="rounded-xl bg-gray-50 p-5 text-sm">
            <p className="font-bold">
              {data.address_line_1}, {data.city}
            </p>
            <p>
              {data.purpose === "sale" ? "For sale" : "For rent"} · $
              {Number(data.asking_price || 0).toLocaleString()} ·{" "}
              {data.property_type}
            </p>
            <p className="mt-2 text-gray-600">
              {files.length} file(s) selected. A team member will review this
              submission before it can be public.
            </p>
          </div>
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              checked={data.ownership_confirmed}
              onChange={(e) => update("ownership_confirmed", e.target.checked)}
            />
            I confirm that I own this property or am authorized to advertise it.
          </label>
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              checked={data.publication_consent}
              onChange={(e) => update("publication_consent", e.target.checked)}
            />
            I consent to review and possible publication as a clearly labelled
            non-MLS listing.
          </label>
        </section>
      )}
      {error && (
        <p role="alert" className="mt-5 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || saving}
          onClick={() => setStep((value) => value - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            disabled={!canContinue()}
            onClick={() => setStep((value) => value + 1)}
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={!canContinue() || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit
            for review
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="mb-1.5 block">{label}</span>
      <div className="[&_input]:w-full [&_select]:h-10 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:px-3">
        {children}
      </div>
    </label>
  );
}
