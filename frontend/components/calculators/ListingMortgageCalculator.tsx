"use client";

import React, { useState } from "react";

export function ListingMortgageCalculator() {
  const [price, setPrice] = useState(286600);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(6);
  const [downPaymentPercent, setDownPaymentPercent] = useState(34);

  const downPaymentAmount = (price * downPaymentPercent) / 100;
  const principal = price - downPaymentAmount;
  const monthlyRate = rate / 100 / 12;
  const totalMonths = term * 12;
  const monthlyPayment =
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths));

  return (
    <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Mortgage Calculator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Home Price */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Home Price:
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={price}
              onChange={(e) => setPrice(+e.target.value)}
            />
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Term:</label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={term}
              onChange={(e) => setTerm(+e.target.value)}
            />
          </div>

          {/* Rate */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Rate (%):
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={rate}
              onChange={(e) => setRate(+e.target.value)}
            />
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Down Payment: ${downPaymentAmount.toLocaleString('en-US')} (
              {downPaymentPercent}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(+e.target.value)}
              className="w-full accent-teal-600"
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col justify-center items-center border-l border-gray-200 pl-6">
          <h3 className="text-lg font-semibold mb-2">Mortgage Payment</h3>
          <p className="text-3xl font-bold text-teal-600">
            ${monthlyPayment.toFixed(0)}
          </p>
          <p className="text-sm text-gray-600 mt-2 text-center">
            * Source: Calculation formula compiled by HouseSigma. This is for
            educational use only.
          </p>
        </div>
      </div>
    </div>
  );
}
