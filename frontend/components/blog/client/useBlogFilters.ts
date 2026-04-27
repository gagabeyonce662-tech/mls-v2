"use client";

import { useMemo, useState } from "react";

import type { VlogPost } from "@/lib/api";

const PUBLIC_STATUSES = new Set(["published", "draft"]);

export function useBlogFilters(posts: VlogPost[]) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (post) => post.category?.name === selectedCategory,
      );
    }

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      filtered = filtered.filter((post) => {
        const title = post.title?.toLowerCase() ?? "";
        const excerpt = post.excerpt?.toLowerCase() ?? "";
        const categoryName = post.category?.name?.toLowerCase() ?? "";

        return (
          title.includes(query) ||
          excerpt.includes(query) ||
          categoryName.includes(query)
        );
      });
    }

    return filtered.filter((post) => PUBLIC_STATUSES.has(post.status));
  }, [posts, searchQuery, selectedCategory]);

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredPosts,
  };
}
