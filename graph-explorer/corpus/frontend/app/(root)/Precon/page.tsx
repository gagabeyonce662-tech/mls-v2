"use client";

import CSVUploadPreConn from "@/components/PreCon";
import { ManualPropertyForm } from "@/components/ManualPropertyForm";
import { env } from "@/lib/env";
import { useState } from "react";
import { Building2, FileUp, ListPlus } from "lucide-react";
import { colors } from "@/config/design-system";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"bulk" | "single">("bulk");

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="text-center mb-10">
        <h1
          className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3"
          style={{ color: colors.heading }}
        >
          <Building2 className="w-10 h-10 text-purple-600" />
          Manage Pre-Construction
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Add and manage pre-construction properties. You can either bulk upload
          IDs found on REALTOR.ca or manually create custom listings.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "bulk"
                ? "bg-white shadow-md text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileUp className="w-4 h-4" />
            Bulk Tagging / CSV
          </button>
          <button
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "single"
                ? "bg-white shadow-md text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListPlus className="w-4 h-4" />
            Manual New Entry
          </button>
        </div>
      </div>

      <div className="animate-fadeIn">
        {activeTab === "bulk" ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl border">
            <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
              <svg
                className="w-5 h-5 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-bold mb-1">Bulk Tagging Tool</p>
                <p>
                  Use this to mark existing REALTOR.ca properties as
                  "Pre-Construction" in your database by their listing IDs.
                </p>
              </div>
            </div>
            <CSVUploadPreConn
              authToken={env.NEXT_PUBLIC_API_TOKEN ?? null}
              fieldName="file"
              onSuccess={(resp) => {
                console.log("server response", resp);
              }}
              onError={(err) => {
                console.error(err);
              }}
            />
          </div>
        ) : (
          <ManualPropertyForm />
        )}
      </div>
    </div>
  );
}
