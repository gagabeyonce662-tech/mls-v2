"use client";

import { useState } from "react";
import { MortgageCalculator } from "@/components/ui/MortgageCalculator";
import { CashflowCalculator, type CashflowCalculatorProps } from "@/components/calculators/CashflowCalculator";
import ClosingCostsEstimator from "@/components/listing/details/ClosingCostsEstimator";

type Tab = "mortgage" | "closing" | "cashflow";

interface FinancialsPanelProps {
  mortgageInitialPrice: number;
  closingCostsPrice: number | null;
  cashflowInitials: CashflowCalculatorProps;
  cashflowDisclaimer: string;
  mortgageTitle: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "mortgage", label: "Mortgage" },
  { key: "closing", label: "Closing Costs" },
  { key: "cashflow", label: "Cash Flow" },
];

export default function FinancialsPanel({
  mortgageInitialPrice,
  closingCostsPrice,
  cashflowInitials,
  cashflowDisclaimer,
  mortgageTitle,
}: FinancialsPanelProps) {
  const [tab, setTab] = useState<Tab>("mortgage");

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ds-heading mb-4">{mortgageTitle}</h2>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-ds-card/60 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? "bg-white shadow-sm text-ds-heading"
                : "text-ds-body hover:text-ds-heading"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mortgage" && (
        <MortgageCalculator initialPrice={mortgageInitialPrice} />
      )}

      {tab === "closing" && (
        closingCostsPrice ? (
          <ClosingCostsEstimator price={closingCostsPrice} />
        ) : (
          <p className="text-sm text-ds-body py-4">
            List price not available — closing cost estimates cannot be calculated.
          </p>
        )
      )}

      {tab === "cashflow" && (
        <>
          <p className="text-sm text-ds-body mb-4 max-w-2xl">{cashflowDisclaimer}</p>
          <CashflowCalculator {...cashflowInitials} />
        </>
      )}
    </section>
  );
}
