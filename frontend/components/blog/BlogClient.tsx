"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { colors } from "@/config/design-system";
import { VlogPost } from "@/lib/api";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts based on category and search query
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (post) => post.category?.name === selectedCategory,
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.category?.name.toLowerCase().includes(query),
      );
    }

    // Show both published and draft posts (you can change this later to only show published)
    return filtered.filter(
      (post) => post.status === "published" || post.status === "draft",
    );
  }, [posts, selectedCategory, searchQuery]);

  const displayCategories = ["All", ...categories];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImageUrl = (post: VlogPost) => {
    if (post.thumbnail) {
      // Handle relative URLs from Django backend
      if (post.thumbnail.startsWith("/")) {
        return `${process.env.NEXT_PUBLIC_API_URL || "https://staging.vsell4u.ca"}${post.thumbnail}`;
      }
      return post.thumbnail;
    }
    return fallbackImage;
  };

  return (
    <>
      {/* Category Filters */}
      <div
        className="bg-white border-b"
        style={{ borderColor: colors.boarder }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center gap-3">
            {displayCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedCategory === category
                    ? "text-white"
                    : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor:
                    selectedCategory === category
                      ? colors.primary
                      : "transparent",
                  color:
                    selectedCategory === category ? colors.cards : colors.body,
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* No Results Message */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              style={{ color: colors.body }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.heading }}
            >
              No blogs found
            </h3>
            <p style={{ color: colors.body }}>
              Try adjusting your search or category filters.
            </p>
          </div>
        ) : (
          /* Blog Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article
                  className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                  style={{ backgroundColor: colors.cards }}
                >
                  {/* Image */}
                  <div className="relative h-56">
                    <img
                      src={getImageUrl(post)}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImage;
                      }}
                    />
                    {post.category && (
                      <div className="absolute top-4 left-4">
                        <span
                          className="px-3 py-1.5 rounded-md text-xs font-semibold"
                          style={{
                            backgroundColor: colors.icon,
                            color: colors.cards,
                          }}
                        >
                          {post.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3
                      className="text-lg font-bold mb-3 leading-snug line-clamp-2"
                      style={{ color: colors.heading }}
                    >
                      {post.title}
                    </h3>

                    <p
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: colors.body }}
                    >
                      {post.excerpt || "Click to read the full article..."}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs" style={{ color: colors.body }}>
                        {formatDate(post.publish_date || post.created_at)}
                      </span>
                      {(post.embed_url || post.video_file) && (
                        <span
                          className="text-xs px-2 py-1 rounded flex items-center gap-1"
                          style={{
                            backgroundColor: colors.boarder,
                            color: colors.body,
                          }}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                          Video
                        </span>
                      )}
                    </div>

                    <button
                      className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full hover:opacity-90"
                      style={{
                        backgroundColor: colors.primary,
                        color: colors.cards,
                      }}
                    >
                      Read Now
                    </button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
