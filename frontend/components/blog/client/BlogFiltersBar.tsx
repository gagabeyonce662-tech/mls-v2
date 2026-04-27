"use client";

import { colors } from "@/config/design-system";

interface BlogFiltersBarProps {
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onSearchQueryChange: (query: string) => void;
}

export function BlogFiltersBar({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchQueryChange,
}: BlogFiltersBarProps) {
  return (
    <div className="bg-white border-b" style={{ borderColor: colors.boarder }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === category ? "text-white" : "hover:opacity-80"
              }`}
              style={{
                backgroundColor:
                  selectedCategory === category ? colors.primary : "transparent",
                color: selectedCategory === category ? colors.cards : colors.body,
              }}
            >
              {category}
            </button>
          ))}

          <div className="ml-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-offset-1 text-sm"
                style={{
                  borderColor: colors.boarder,
                  backgroundColor: colors.cards,
                  color: colors.heading,
                }}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: colors.body }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
