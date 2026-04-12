"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";

interface MortgageCalculatorProps {
  initialPrice?: number;
}

export function MortgageCalculator({ initialPrice = 500000 }: MortgageCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState<string>(initialPrice.toString());
  const [downPayment, setDownPayment] = useState<string>((initialPrice * 0.2).toString());
  const [interestRate, setInterestRate] = useState<string>("5.5");
  const [amortization, setAmortization] = useState<string>("25");
  const [term, setTerm] = useState(5);

  const calculateMortgage = () => {
    const price = parseFloat(purchasePrice) || 0;
    const dp = parseFloat(downPayment) || 0;
    const rate = parseFloat(interestRate) || 0;
    const amort = parseFloat(amortization) || 0;

    const principal = price - dp;
    const monthlyRate = rate / 100 / 12;
    const numPayments = amort * 12;

    if (monthlyRate === 0 || numPayments === 0) {
      return numPayments > 0 ? principal / numPayments : 0;
    }

    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return isFinite(monthlyPayment) ? monthlyPayment : 0;
  };

  const monthlyPayment = calculateMortgage();

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchase-price" className="text-xs font-semibold uppercase tracking-wider text-ds-body">
              Purchase Price <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body/50">$</span>
              <Input
                id="purchase-price"
                type="text"
                className={`pl-7 bg-white/50 border-ds-card-border ${!purchasePrice ? "border-red-300 focus:ring-red-100" : ""}`}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value.replace(/[^0-9.]/g, ""))}
              />
            </div>
            {!purchasePrice && <p className="text-[10px] text-red-500 font-medium italic">This field is necessary</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="down-payment" className="text-xs font-semibold uppercase tracking-wider text-ds-body">
              Down Payment <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body/50">$</span>
              <Input
                id="down-payment"
                type="text"
                className={`pl-7 bg-white/50 border-ds-card-border ${!downPayment ? "border-red-300 focus:ring-red-100" : ""}`}
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value.replace(/[^0-9.]/g, ""))}
              />
            </div>
            {!downPayment && <p className="text-[10px] text-red-500 font-medium italic">This field is necessary</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest-rate" className="text-xs font-semibold uppercase tracking-wider text-ds-body">
              Interest Rate (%) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="interest-rate"
              type="text"
              className={`bg-white/50 border-ds-card-border ${!interestRate ? "border-red-300 focus:ring-red-100" : ""}`}
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value.replace(/[^0-9.]/g, ""))}
            />
            {!interestRate && <p className="text-[10px] text-red-500 font-medium italic">This field is necessary</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amortization" className="text-xs font-semibold uppercase tracking-wider text-ds-body">
              Amortization (years) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amortization"
              type="text"
              className={`bg-white/50 border-ds-card-border ${!amortization ? "border-red-300 focus:ring-red-100" : ""}`}
              value={amortization}
              onChange={(e) => setAmortization(e.target.value.replace(/[^0-9.]/g, ""))}
            />
            {!amortization && <p className="text-[10px] text-red-500 font-medium italic">This field is necessary</p>}
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-ds-primary/5 border border-ds-primary/10 mt-8 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-ds-primary">
              <path d="M20 20v-4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4"></path>
              <rect width="16" height="12" x="4" y="4" rx="2"></rect>
              <path d="M12 8v4"></path>
              <path d="M8 12h8"></path>
            </svg>
          </div>
          <div className="flex flex-col items-center justify-center text-center relative z-10">
            <span className="text-xs font-bold text-ds-primary/60 uppercase tracking-widest mb-1">Estimated Monthly Payment</span>
            <div className="text-5xl font-black text-ds-primary tracking-tight">
              $
              {monthlyPayment.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="text-[11px] text-ds-body/50 mt-3 font-semibold uppercase tracking-wider">
              Principal & Interest • Current Rates
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
