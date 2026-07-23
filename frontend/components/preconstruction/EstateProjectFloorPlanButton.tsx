"use client";

import PhoneVerifiedActionButton from "@/components/listing/PhoneVerifiedActionButton";

export default function EstateProjectFloorPlanButton() {
  return (
    <PhoneVerifiedActionButton
      onAccess={() =>
        document
          .getElementById("documents")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className="flex w-full items-center justify-center rounded-xl bg-ds-primary px-5 py-3 font-bold text-white transition hover:opacity-90"
    >
      View floor plans
    </PhoneVerifiedActionButton>
  );
}
