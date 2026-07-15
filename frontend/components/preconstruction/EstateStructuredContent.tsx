"use client";
import { useState } from "react";
import type { EstateProject } from "@/lib/api/estate";
import { accessEstateDocument, requestEstateDocument } from "@/lib/api/estate";
import PhoneVerificationModal from "@/components/listing/PhoneVerificationModal";

export default function EstateStructuredContent({project}:{project:EstateProject}) {
  const [message, setMessage] = useState("");
  const [pendingDocumentId, setPendingDocumentId] = useState<number | null>(null);
  const openDocument = async (id:number) => {
    setMessage("");
    try {
      const intent = await requestEstateDocument(id);
      if (intent.verification_required) { setPendingDocumentId(id); return; }
      await accessEstateDocument(id);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to open document."); }
  };
  return <div className="space-y-10">
    {!!project.unit_types?.length && <section><h2 className="text-2xl font-bold mb-4">Home types</h2><ul className="list-disc pl-6">{project.unit_types.map(x=><li key={x.id}><strong>{x.name}</strong>{x.description && ` — ${x.description}`}</li>)}</ul></section>}
    {!!project.prices?.length && <section><h2 className="text-2xl font-bold mb-4">Pricing</h2><div className="overflow-x-auto"><table className="min-w-full border-collapse"><thead><tr><th className="text-left border-b p-3">Home type</th><th className="text-left border-b p-3">Price</th></tr></thead><tbody>{project.prices.map(x=><tr key={x.id}><td className="border-b p-3">{project.unit_types?.find(u=>u.id===x.unit_type_id)?.name || "General"}</td><td className="border-b p-3">{x.display_text}</td></tr>)}</tbody></table></div></section>}
    {!!project.deposit_plans?.length && <section><h2 className="text-2xl font-bold mb-4">Deposit schedules</h2>{project.deposit_plans.map(plan=><div key={plan.id} className="mb-5"><h3 className="font-semibold">{plan.title}</h3><div className="overflow-x-auto"><table className="min-w-full"><tbody>{plan.installments.map(x=><tr key={x.id}><td className="border-b p-3">{x.milestone}</td><td className="border-b p-3">{x.amount_text}</td></tr>)}</tbody></table></div></div>)}</section>}
    {!!project.incentives?.length && <section><h2 className="text-2xl font-bold mb-4">Incentives</h2><ul className="list-disc pl-6">{project.incentives.map(x=><li key={x.id}>{x.description}</li>)}</ul></section>}
    {!!project.amenities?.length && <section><h2 className="text-2xl font-bold mb-4">Amenities & location</h2><ul className="list-disc pl-6">{project.amenities.map(x=><li key={x.id}>{x.description}{x.travel_time_minutes != null && ` (${x.travel_time_minutes} min)`}</li>)}</ul></section>}
    {!!project.documents?.length && <section><h2 className="text-2xl font-bold mb-4">Documents</h2><div className="flex flex-wrap gap-3">{project.documents.map(x=><button className="rounded-lg bg-ds-primary px-4 py-2 text-white" key={x.id} onClick={()=>openDocument(x.id)}>{x.label}</button>)}</div>{message && <p role="status" className="mt-3 text-sm">{message}</p>}</section>}
    {pendingDocumentId !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><div className="relative"><button type="button" aria-label="Close phone verification" onClick={()=>setPendingDocumentId(null)} className="absolute -right-2 -top-2 z-10 rounded-full bg-white px-2 py-1 text-xs font-bold shadow">X</button><PhoneVerificationModal onVerified={async()=>{const id=pendingDocumentId; setPendingDocumentId(null); await accessEstateDocument(id);}}/></div></div>}
  </div>;
}
