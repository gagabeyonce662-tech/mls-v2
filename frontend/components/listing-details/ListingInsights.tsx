"use client";

import { useState } from "react";
import { ListingMortgageCalculator } from "@/components/calculators/ListingMortgageCalculator";
import { CashflowCalculator } from "@/components/calculators/CashflowCalculator";
import type { ListingDetailsData } from "@/data/listingDetails";

interface ListingInsightsProps {
  propertyData?: ListingDetailsData;
}

export function ListingInsights({ propertyData }: ListingInsightsProps) {
  // Notes / toggles for the insights section
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  return (
    <section className="mt-16 border-t border-gray-200 pt-10 space-y-10">
      {/* --- Write a Note --- */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Write a Note About This Home
          </h2>

          {/* High-contrast Toggle Switch */}
          <button
            onClick={() => setShowNote(!showNote)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 border ${showNote
                ? "bg-teal-500 border-teal-600 shadow-[0_0_6px_rgba(13,148,136,0.6)]"
                : "bg-gray-600 border-gray-800 shadow-[0_0_4px_rgba(0,0,0,0.5)]"
              }`}
            aria-label="Toggle note section"
          >
            <span
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${showNote ? "translate-x-5" : "translate-x-0"
                }`}
            />
          </button>
        </div>

        {/* Conditionally show textarea */}
        {showNote && (
          <textarea
            className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Add your personal notes about this property..."
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        )}
      </div>

      {/* --- Tax History --- */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tax History</h2>
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Year</th>
              <th className="p-2 text-left">Taxes</th>
              <th className="p-2 text-left">Land</th>
              <th className="p-2 text-left">Building</th>
              <th className="p-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            <tr className="border-t">
              <td className="p-2">2021</td>
              <td className="p-2">$2,526</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">$209,000</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">2020</td>
              <td className="p-2">$2,484</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">$209,000</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">2019</td>
              <td className="p-2">$2,373</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">$194,250</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- Mortgage  Calculator --- */}
      <ListingMortgageCalculator />

      {/* ---  Cashflow Calculator --- */}
      <CashflowCalculator />

      {/* --- Nearby Schools --- */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Nearby Schools
        </h2>
        <ul className="space-y-2 text-gray-800">
          <li>🏫 Westdale Secondary School — 3.2 km</li>
          <li>🏫 St. Lawrence Catholic Elementary School — 0.5 km</li>
        </ul>
      </div>

      {/* --- Market Stats --- */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Market Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800">
          <div className="border p-4 rounded-lg bg-white">
            <p className="text-sm text-gray-500">October 2025</p>
            <h3 className="text-xl font-semibold">Median Price</h3>
            <p className="text-teal-600 font-bold text-lg">$431,667</p>
          </div>
          <div className="border p-4 rounded-lg bg-white">
            <p className="text-sm text-gray-500">October 2025</p>
            <h3 className="text-xl font-semibold">New Listings</h3>
            <p className="text-teal-600 font-bold text-lg">5</p>
          </div>
          <div className="border p-4 rounded-lg bg-white">
            <p className="text-sm text-gray-500">October 2025</p>
            <h3 className="text-xl font-semibold">Median Days on Market</h3>
            <p className="text-teal-600 font-bold text-lg">47</p>
          </div>
        </div>
        <div className="mt-6 text-sm text-gray-600">
          1 Year: <span className="text-red-600">-7.9%</span> • 5 Years:{" "}
          <span className="text-green-600">+6%</span> • 10 Years:{" "}
          <span className="text-green-600">+113%</span>
        </div>
      </div>

      {/* --- Demographics --- */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Demographics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-800">
          <div>
            Population (2021): <strong>446</strong>
          </div>
          <div>
            Average Age: <strong>40.4</strong>
          </div>
          <div>
            Average Income: <strong>$72,500</strong>
          </div>
          <div>
            Renters: <strong>75.5%</strong>
          </div>
          <div>
            Condos: <strong>14.3%</strong>
          </div>
          <div>
            Education: <strong>41.1% College/University</strong>
          </div>
          <div>
            Average Home Value: <strong>$600,000</strong>
          </div>
          <div>
            Households with Children: <strong>36.4%</strong>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          * Source: Statistics Canada - 2021 Census
        </p>
      </div>

      {/* --- Disclaimers --- */}
      <div className="text-xs text-gray-500 mt-8">
        Data is provided courtesy of PROPTX. The information herein must only be
        used by consumers with a bona fide interest in real estate transactions.
        The information is deemed reliable but not guaranteed accurate by
        PROPTX.
        <br />© 2025 HouseSigma Inc. All rights reserved.
      </div>
    </section>
  );
}
