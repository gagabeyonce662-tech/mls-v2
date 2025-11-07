"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";

export function MortgageCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [amortization, setAmortization] = useState(25);
  const [term, setTerm] = useState(5);

  const calculateMortgage = () => {
    const principal = purchasePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = amortization * 12;

    if (monthlyRate === 0) {
      return principal / numPayments;
    }

    const monthlyPayment =
      principal *
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return monthlyPayment;
  };

  const monthlyPayment = calculateMortgage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mortgage Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="purchase-price">Purchase Price</Label>
          <Input
            id="purchase-price"
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="down-payment">Down Payment</Label>
          <Input
            id="down-payment"
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interest-rate">Interest Rate (%)</Label>
          <Input
            id="interest-rate"
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amortization">Amortization (years)</Label>
          <Input
            id="amortization"
            type="number"
            value={amortization}
            onChange={(e) => setAmortization(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="term">Term (years)</Label>
          <Input
            id="term"
            type="number"
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
          />
        </div>
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600 mb-1">Mortgage Payment</div>
          <div className="text-3xl font-bold text-teal-600">
            ${monthlyPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-1">per month</div>
        </div>
      </CardContent>
    </Card>
  );
}

