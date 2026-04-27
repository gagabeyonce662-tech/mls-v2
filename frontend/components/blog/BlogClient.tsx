"use client";

import { useState } from "react";

import { colors } from "@/config/design-system";
import { VlogPost } from "@/lib/api";

import { BlogEmptyState } from "./client/BlogEmptyState";
import { BlogFiltersBar } from "./client/BlogFiltersBar";
import { BlogPostCard } from "./client/BlogPostCard";
import { useBlogFilters } from "./client/useBlogFilters";

interface BlogClientProps {
  posts: VlogPost[];
  categories: string[];
  fallbackImage: string;
}

export default function BlogClient({
  posts,
  categories,
  fallbackImage,
}: BlogClientProps) {
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());
  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredPosts,
  } = useBlogFilters(posts);

  const displayCategories = ["All", ...categories];
  const handleImageError = (postId: number) => {
    setFailedImageIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  };

  return (
    <>
      <BlogFiltersBar
        categories={displayCategories}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onCategoryChange={setSelectedCategory}
        onSearchQueryChange={setSearchQuery}
      />

      {/* Blog Posts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" style={{ color: colors.heading }}>
            {selectedCategory === "All"
              ? "Latest Blogs"
              : `${selectedCategory} Blogs`}
          </h2>
          <p className="text-sm" style={{ color: colors.body }}>
            {filteredPosts.length}{" "}
            {filteredPosts.length === 1 ? "post" : "posts"} found
          </p>
        </div>

        {filteredPosts.length === 0 ? (
          <BlogEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                fallbackImage={fallbackImage}
                failedImageIds={failedImageIds}
                onImageError={handleImageError}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
