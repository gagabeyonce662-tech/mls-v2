"use client";

import React, { useState } from "react";

export function CashflowCalculator() {
  const [homePrice, setHomePrice] = useState(286600);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(6);
  const [downPaymentPercent, setDownPaymentPercent] = useState(34);
  const [propertyTax, setPropertyTax] = useState(16);
  const [maintenance, setMaintenance] = useState(98765);
  const [rentalIncome, setRentalIncome] = useState(2489);
  const [otherPayment, setOtherPayment] = useState(0); // optional “extra monthly cost”

  // derived values
  const downPaymentAmount = (homePrice * downPaymentPercent) / 100;
  const principal = homePrice - downPaymentAmount;
  const monthlyRate = rate / 100 / 12;
  const totalMonths = term * 12;
  const mortgagePayment =
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths));

  // maintenance assumed yearly, propertyTax monthly
  const monthlyMaintenance = maintenance / 12;

  // core monthly cashflow logic
  const cashFlow =
    rentalIncome -
    (mortgagePayment + propertyTax + monthlyMaintenance + otherPayment);

  // For circular progress ring
  const maxDisplay = 10000; // cap visualization range
  const percent = Math.min(Math.abs(cashFlow) / maxDisplay, 1) * 100;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percent / 100) * circumference;
  const positive = cashFlow >= 0;

  return (
    <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Cash Flow Analysis
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Home Price:
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={homePrice}
              onChange={(e) => setHomePrice(+e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Term (years):
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={term}
              onChange={(e) => setTerm(+e.target.value)}
            />
          </div>

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

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Down Payment: ${downPaymentAmount.toLocaleString()} (
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

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Property Tax (Monthly):
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={propertyTax}
              onChange={(e) => setPropertyTax(+e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Maintenance Cost (Yearly):
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={maintenance}
              onChange={(e) => setMaintenance(+e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Rental Income (Monthly):
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={rentalIncome}
              onChange={(e) => setRentalIncome(+e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Other Monthly Payment:
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={otherPayment}
              onChange={(e) => setOtherPayment(+e.target.value)}
            />
          </div>
        </div>

        {/* Right Column - Mortgage + Circular Graph */}
        <div className="flex flex-col justify-center items-center border-l border-gray-200 pl-6">
          {/* Monthly Mortgage Section */}
          <div className="text-center mb-8">
            <h3 className="font-semibold text-gray-700">
              Monthly Mortgage Payment
            </h3>
            <p className="text-3xl font-bold text-teal-600">
              ${mortgagePayment.toFixed(0)}
            </p>
          </div>

          {/* Circular Graph for Cash Flow */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-4">
            <svg className="w-44 h-44 transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="70"
                stroke="#E5E7EB" // gray background track
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="88"
                cy="88"
                r="70"
                stroke={positive ? "#14B8A6" : "#DC2626"} // bright teal vs red
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>

            <div className="absolute text-center">
              <p className="text-gray-700 text-lg font-semibold">Cash Flow</p>
              <p
                className={`text-2xl font-bold ${
                  positive ? "text-teal-600" : "text-red-600"
                }`}
              >
                ${cashFlow.toFixed(0)}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-2 text-center max-w-xs">
            * Source: Calculation formula compiled by HouseSigma. This is for
            educational use only.
          </p>
        </div>
      </div>
    </div>
  );
}
