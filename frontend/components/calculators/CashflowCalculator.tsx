"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ds } from "@/lib/design-system-utils";

export type CashflowCalculatorProps = {
  /** Purchase price or financed amount basis (defaults if missing). */
  initialHomePrice?: number;
  /** Expected gross monthly rent (defaults 0). */
  initialMonthlyRent?: number;
  /** Monthly property tax portion (from annual / 12 when available). */
  initialMonthlyPropertyTax?: number;
  /** Annual maintenance reserve (defaults ~0.5% of home price when home price set). */
  initialAnnualMaintenance?: number;
  initialOtherMonthly?: number;
  initialTermYears?: number;
  initialInterestRatePercent?: number;
  initialDownPaymentPercent?: number;
};

function clampMoney(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function CashflowCalculator({
  initialHomePrice = 0,
  initialMonthlyRent = 0,
  initialMonthlyPropertyTax = 0,
  initialAnnualMaintenance,
  initialOtherMonthly = 0,
  initialTermYears = 25,
  initialInterestRatePercent = 6,
  initialDownPaymentPercent = 20,
}: CashflowCalculatorProps) {
  const defaultMaintenance =
    initialAnnualMaintenance ??
    (initialHomePrice > 0 ? Math.round(initialHomePrice * 0.005) : 3000);

  const [homePrice, setHomePrice] = useState(() =>
    clampMoney(initialHomePrice > 0 ? initialHomePrice : 500000),
  );
  const [term, setTerm] = useState(initialTermYears);
  const [rate, setRate] = useState(initialInterestRatePercent);
  const [downPaymentPercent, setDownPaymentPercent] = useState(
    initialDownPaymentPercent,
  );
  const [propertyTaxMonthly, setPropertyTaxMonthly] = useState(() =>
    clampMoney(initialMonthlyPropertyTax),
  );
  const [maintenanceAnnual, setMaintenanceAnnual] = useState(() =>
    clampMoney(defaultMaintenance),
  );
  const [rentalIncome, setRentalIncome] = useState(() =>
    clampMoney(initialMonthlyRent),
  );
  const [otherPayment, setOtherPayment] = useState(() =>
    clampMoney(initialOtherMonthly),
  );

  const derived = useMemo(() => {
    const downPaymentAmount = (homePrice * downPaymentPercent) / 100;
    const principal = Math.max(0, homePrice - downPaymentAmount);
    const monthlyRate = rate / 100 / 12;
    const totalMonths = Math.max(1, term * 12);
    let mortgagePayment = 0;
    if (principal > 0 && monthlyRate > 0) {
      mortgagePayment =
        (principal * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -totalMonths));
    } else if (principal > 0 && monthlyRate === 0) {
      mortgagePayment = principal / totalMonths;
    }
    const monthlyMaintenance = maintenanceAnnual / 12;
    const cashFlow =
      rentalIncome -
      (mortgagePayment +
        propertyTaxMonthly +
        monthlyMaintenance +
        otherPayment);
    const maxDisplay = 10000;
    const percent = Math.min(Math.abs(cashFlow) / maxDisplay, 1) * 100;
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (percent / 100) * circumference;
    return {
      mortgagePayment,
      cashFlow,
      offset,
      circumference,
      positive: cashFlow >= 0,
      downPaymentAmount,
    };
  }, [
    homePrice,
    term,
    rate,
    downPaymentPercent,
    propertyTaxMonthly,
    maintenanceAnnual,
    rentalIncome,
    otherPayment,
  ]);

  return (
    <Card className="border border-ds-card-border bg-ds-card/30 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className={ds.h3}>Cash flow (estimator)</CardTitle>
        <p className="text-xs text-ds-body leading-relaxed">
          Illustrative only. Edit assumptions below — not financial advice. Does
          not replace professional underwriting.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-ds-body">
                Property value / financed basis
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body/50">
                  $
                </span>
                <Input
                  type="text"
                  className="pl-7 bg-white border-ds-card-border"
                  value={String(homePrice)}
                  onChange={(e) =>
                    setHomePrice(
                      clampMoney(parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0),
                    )
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-ds-body">Amortization (years)</Label>
                <Input
                  type="number"
                  className="bg-white border-ds-card-border"
                  value={term}
                  min={1}
                  max={40}
                  onChange={(e) => setTerm(Math.max(1, +e.target.value || 25))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-ds-body">Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="bg-white border-ds-card-border"
                  value={rate}
                  onChange={(e) => setRate(Math.max(0, +e.target.value || 0))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-ds-body">
                Down payment ({downPaymentPercent}%) — $
                {derived.downPaymentAmount.toLocaleString("en-CA", {
                  maximumFractionDigits: 0,
                })}
              </Label>
              <input
                type="range"
                min={0}
                max={100}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(+e.target.value)}
                className="w-full accent-ds-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-ds-body">Property tax (monthly)</Label>
              <Input
                type="number"
                className="bg-white border-ds-card-border"
                value={propertyTaxMonthly}
                onChange={(e) =>
                  setPropertyTaxMonthly(clampMoney(+e.target.value || 0))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-ds-body">Maintenance (annual)</Label>
              <Input
                type="number"
                className="bg-white border-ds-card-border"
                value={maintenanceAnnual}
                onChange={(e) =>
                  setMaintenanceAnnual(clampMoney(+e.target.value || 0))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-ds-body">Gross rent (monthly)</Label>
              <Input
                type="number"
                className="bg-white border-ds-card-border"
                value={rentalIncome}
                onChange={(e) =>
                  setRentalIncome(clampMoney(+e.target.value || 0))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-ds-body">Other monthly costs</Label>
              <Input
                type="number"
                className="bg-white border-ds-card-border"
                value={otherPayment}
                onChange={(e) =>
                  setOtherPayment(clampMoney(+e.target.value || 0))
                }
              />
            </div>
          </div>

          <div className="flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-ds-card-border pt-6 md:pt-0 md:pl-6">
            <div className="text-center mb-6">
              <h3 className="font-semibold text-ds-heading text-sm">
                Monthly mortgage payment
              </h3>
              <p className="text-3xl font-bold text-ds-primary mt-1">
                $
                {derived.mortgagePayment.toLocaleString("en-CA", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div className="relative w-44 h-44 flex items-center justify-center mb-2">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="70"
                  stroke="currentColor"
                  className="text-gray-200"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="70"
                  stroke={derived.positive ? "var(--ds-primary, #2563eb)" : "#dc2626"}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={derived.circumference}
                  strokeDashoffset={derived.offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div className="absolute text-center px-2">
                <p className="text-ds-body text-sm font-semibold">Net (monthly)</p>
                <p
                  className={`text-2xl font-bold ${derived.positive ? "text-ds-primary" : "text-red-600"}`}
                >
                  $
                  {derived.cashFlow.toLocaleString("en-CA", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-ds-body text-center max-w-xs leading-relaxed">
              Insurance, vacancy, and capital expenses are not modeled unless you
              add them under &quot;Other monthly costs.&quot;
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
