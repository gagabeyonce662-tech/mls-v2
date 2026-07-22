"use client";

import { useState } from "react";
import {
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Download,
  Gift,
  Landmark,
  MapPinned,
} from "lucide-react";

import PhoneVerificationModal from "@/components/listing/PhoneVerificationModal";
import type { EstateProject } from "@/lib/api/estate";
import { accessEstateDocument, requestEstateDocument } from "@/lib/api/estate";

interface EstateStructuredContentProps {
  project: EstateProject;
}

function SectionCard({
  title,
  icon,
  children,
  id,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          {icon}
        </div>

        <h2 className="text-2xl font-extrabold text-slate-950">{title}</h2>
      </div>

      {children}
    </section>
  );
}

export default function EstateStructuredContent({
  project,
}: EstateStructuredContentProps) {
  const [message, setMessage] = useState("");
  const [pendingDocumentId, setPendingDocumentId] = useState<number | null>(
    null,
  );

  const unitTypes = project.unit_types.filter((item) => item.name.trim());

  const prices = project.prices.filter((item) => item.display_text.trim());

  const depositPlans = project.deposit_plans.filter(
    (plan) => plan.title.trim() || plan.installments.length > 0,
  );

  const incentives = project.incentives.filter((item) =>
    item.description.trim(),
  );

  const amenities = project.amenities.filter((item) => item.description.trim());

  const documents = project.documents.filter((item) => item.label.trim());

  const openDocument = async (id: number) => {
    setMessage("");

    try {
      const intent = await requestEstateDocument(id);

      if (intent.verification_required) {
        setPendingDocumentId(id);
        return;
      }

      await accessEstateDocument(id);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to open document.",
      );
    }
  };

  return (
    <div className="space-y-8">
      {unitTypes.length > 0 && (
        <SectionCard
          title="Home types"
          icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {unitTypes.map((unitType) => (
              <div
                key={unitType.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="font-bold text-slate-950">{unitType.name}</p>

                {unitType.description.trim() && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {unitType.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {prices.length > 0 && (
        <SectionCard
          title="Pricing"
          icon={<BadgeDollarSign className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Home type
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Starting price
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {prices.map((price) => {
                  const unitType = unitTypes.find(
                    (item) => item.id === price.unit_type_id,
                  );

                  return (
                    <tr key={price.id}>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {unitType?.name || "General"}
                      </td>

                      <td className="px-5 py-4 font-bold text-ds-primary">
                        {price.display_text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {depositPlans.length > 0 && (
        <SectionCard
          title="Deposit schedules"
          icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="space-y-5">
            {depositPlans.map((plan) => (
              <article
                key={plan.id}
                className="overflow-hidden rounded-2xl border border-slate-200"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <h3 className="font-extrabold text-slate-950">
                    {plan.title || "Deposit structure"}
                  </h3>
                </div>

                {plan.installments.length > 0 && (
                  <div className="divide-y divide-slate-200">
                    {plan.installments.map((installment) => (
                      <div
                        key={installment.id}
                        className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <p className="font-medium text-slate-700">
                          {installment.milestone}
                        </p>

                        <p className="font-bold text-slate-950">
                          {installment.amount_text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {incentives.length > 0 && (
        <SectionCard
          title="Current incentives"
          icon={<Gift className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {incentives.map((incentive) => (
              <div
                key={incentive.id}
                className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />

                <p className="font-medium leading-6 text-emerald-950">
                  {incentive.description}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {amenities.length > 0 && (
        <SectionCard
          title="Amenities & location"
          icon={<MapPinned className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-orange-600"
                  aria-hidden="true"
                />

                <p className="leading-6 text-slate-700">
                  {amenity.description}
                  {amenity.travel_time_minutes != null &&
                    ` (${amenity.travel_time_minutes} min)`}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {documents.length > 0 && (
        <SectionCard
          id="documents"
          title="Documents & floor plans"
          icon={<Download className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {documents.map((document) => (
              <button
                type="button"
                key={document.id}
                onClick={() => openDocument(document.id)}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-ds-primary hover:bg-white hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-slate-950">{document.label}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {document.requires_phone_verification
                      ? "Phone verification required"
                      : "Available to download"}
                  </p>
                </div>

                <Download
                  className="h-5 w-5 shrink-0 text-ds-primary"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          {message && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {message}
            </p>
          )}
        </SectionCard>
      )}

      {pendingDocumentId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative">
            <button
              type="button"
              aria-label="Close phone verification"
              onClick={() => setPendingDocumentId(null)}
              className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold shadow-lg"
            >
              ×
            </button>

            <PhoneVerificationModal
              onVerified={async () => {
                const id = pendingDocumentId;
                setPendingDocumentId(null);
                await accessEstateDocument(id);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
