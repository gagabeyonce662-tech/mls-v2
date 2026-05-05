"use client";

import { useMemo, useState } from "react";
import { ds } from "@/lib/design-system-utils";

function ontarioLandTransferTax(price: number): number {
  const brackets = [
    { limit: 55000, rate: 0.005 },
    { limit: 250000, rate: 0.01 },
    { limit: 400000, rate: 0.015 },
    { limit: 2000000, rate: 0.02 },
  ];
  let tax = 0;
  let remaining = price;
  let previousLimit = 0;
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, bracket.limit - previousLimit);
    tax += taxable * bracket.rate;
    remaining -= taxable;
    previousLimit = bracket.limit;
  }
  if (remaining > 0) {
    tax += remaining * 0.025;
  }
  return tax;
}

export default function ClosingCostsEstimator({
  price,
}: {
  price: number | null;
}) {
  const [lawyerFee, setLawyerFee] = useState(1800);
  const [utilitySetup, setUtilitySetup] = useState(500);
  const safePrice = Math.max(0, Number(price || 0));

  const estimate = useMemo(() => {
    const ltt = ontarioLandTransferTax(safePrice);
    const titleInsurance = 400;
    const total = ltt + lawyerFee + utilitySetup + titleInsurance;
    return { ltt, titleInsurance, total };
  }, [safePrice, lawyerFee, utilitySetup]);

  if (!safePrice) return null;

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-8 shadow-sm">
      <h2 className={`${ds.h3} mb-2`}>Estimated closing costs (Ontario)</h2>
      <p className="text-xs text-ds-body mb-6">
        Rule-based estimate; actual lender/legal/municipal costs may vary.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <label className="text-sm text-ds-body">
          Lawyer fees
          <input
            type="number"
            min={0}
            value={lawyerFee}
            onChange={(e) => setLawyerFee(Number(e.target.value || 0))}
            className="mt-1 w-full rounded-lg border border-ds-card-border px-3 py-2 text-ds-heading"
          />
        </label>
        <label className="text-sm text-ds-body">
          Utility setup allowance
          <input
            type="number"
            min={0}
            value={utilitySetup}
            onChange={(e) => setUtilitySetup(Number(e.target.value || 0))}
            className="mt-1 w-full rounded-lg border border-ds-card-border px-3 py-2 text-ds-heading"
          />
        </label>
      </div>
      <div className="rounded-xl border border-ds-card-border bg-ds-card/30 p-4 text-sm space-y-1">
        <p>Land transfer tax: ${estimate.ltt.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
        <p>Title insurance: ${estimate.titleInsurance.toLocaleString("en-US")}</p>
        <p>Lawyer fees: ${lawyerFee.toLocaleString("en-US")}</p>
        <p>Utility setup: ${utilitySetup.toLocaleString("en-US")}</p>
        <p className="pt-2 font-semibold text-ds-heading">
          Total est.: ${estimate.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </p>
      </div>
    </section>
  );
}
