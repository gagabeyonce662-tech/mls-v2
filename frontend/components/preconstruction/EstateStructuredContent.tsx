"use client";

import { useState } from "react";
import PhoneVerificationModal from "@/components/listing/PhoneVerificationModal";
import type { EstateProject } from "@/lib/api/estate";
import { accessEstateDocument, requestEstateDocument } from "@/lib/api/estate";

interface EstateStructuredContentProps {
  project: EstateProject;
}

export default function EstateStructuredContent({
  project,
}: EstateStructuredContentProps) {
  const [message, setMessage] = useState("");
  const [pendingDocumentId, setPendingDocumentId] = useState<number | null>(null);
  const unitTypes = project.unit_types.filter((item) => item.name.trim());
  const prices = project.prices.filter((item) => item.display_text.trim());
  const depositPlans = project.deposit_plans.filter(
    (plan) => plan.title.trim() || plan.installments.length > 0,
  );
  const incentives = project.incentives.filter((item) => item.description.trim());
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
      setMessage(error instanceof Error ? error.message : "Unable to open document.");
    }
  };

  return (
    <div className="space-y-10">
      {unitTypes.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-ds-heading">Home types</h2>
          <ul className="list-disc space-y-2 pl-6 text-ds-body">
            {unitTypes.map((unitType) => (
              <li key={unitType.id}>
                <strong>{unitType.name}</strong>
                {unitType.description.trim() && ` — ${unitType.description}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {prices.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-ds-heading">Pricing</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="border-b p-3 text-left">Home type</th>
                  <th scope="col" className="border-b p-3 text-left">Price</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => (
                  <tr key={price.id}>
                    <td className="border-b p-3">
                      {unitTypes.find((unitType) => unitType.id === price.unit_type_id)
                        ?.name || "General"}
                    </td>
                    <td className="border-b p-3">{price.display_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {depositPlans.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-ds-heading">
            Deposit schedules
          </h2>
          {depositPlans.map((plan) => (
            <div key={plan.id} className="mb-5 last:mb-0">
              {plan.title.trim() && <h3 className="font-semibold">{plan.title}</h3>}
              {plan.installments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <tbody>
                      {plan.installments.map((installment) => (
                        <tr key={installment.id}>
                          <th scope="row" className="border-b p-3 text-left font-normal">
                            {installment.milestone}
                          </th>
                          <td className="border-b p-3">{installment.amount_text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {incentives.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-ds-heading">Incentives</h2>
          <ul className="list-disc space-y-2 pl-6 text-ds-body">
            {incentives.map((incentive) => (
              <li key={incentive.id}>{incentive.description}</li>
            ))}
          </ul>
        </section>
      )}

      {amenities.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-ds-heading">
            Amenities &amp; location
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-ds-body">
            {amenities.map((amenity) => (
              <li key={amenity.id}>
                {amenity.description}
                {amenity.travel_time_minutes != null &&
                  ` (${amenity.travel_time_minutes} min)`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {documents.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-ds-heading">Documents</h2>
          <div className="flex flex-wrap gap-3">
            {documents.map((document) => (
              <button
                type="button"
                className="rounded-lg bg-ds-primary px-4 py-2 text-white"
                key={document.id}
                onClick={() => openDocument(document.id)}
              >
                {document.label}
              </button>
            ))}
          </div>
          {message && <p role="status" className="mt-3 text-sm">{message}</p>}
        </section>
      )}

      {pendingDocumentId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative">
            <button
              type="button"
              aria-label="Close phone verification"
              onClick={() => setPendingDocumentId(null)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white px-2 py-1 text-xs font-bold shadow"
            >
              X
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
