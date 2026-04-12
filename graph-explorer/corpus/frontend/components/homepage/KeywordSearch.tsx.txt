"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function KeywordSearch() {
  const keywords = [
    "Sold Prices",
    "Houses for Sale",
    "Condos for Sale",
    "Townhouses for Sale",
    "Home Appraisal",
    "Find an Agent",
    "Houses",
    "3-Bed Houses",
    "2-Bed Condos",
    "Houses Under $1 mil",
    "Condos > $1,000,000",
    "Most Expensive Houses",
    "Luxury Condos",
    "Cheapest Condos in Toronto",
    "Cheapest Houses in Toronto",
    "Downtown Toronto Condos",
    "Condos for Rent",
    "Houses for Rent",
  ];

  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    console.log(`Searching for: ${keyword}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-6xl mx-auto px-6 py-16"
    >
      {/* Title */}
      <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-10">
        Search by Keywords
      </h2>

      {/* Solid Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-wrap justify-center gap-3">
          <AnimatePresence>
            {keywords.map((keyword, index) => (
              <motion.div
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Badge
                  onClick={() => handleKeywordClick(keyword)}
                  variant={selectedKeyword === keyword ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 
                    ${
                      selectedKeyword === keyword
                        ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    }`}
                >
                  {keyword}
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
