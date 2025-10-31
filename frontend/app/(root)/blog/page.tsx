"use client";

import Header from "../../../components/Header";
import BlogCard from "../../../components/blog/blog/BlogCard";
import { fetchBlogPosts } from "../../../lib/utils/api";
import { BlogPost } from "../../../types/blogPost";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Trading", "Finance", "Investing", "Wealth"];

  const {
    data: blogPosts = [],
    isLoading,
    isFetching,
  } = useQuery<BlogPost[]>({
    queryKey: ["blogPost"],
    queryFn: fetchBlogPosts,
  });

  // ✅ Filtering logic
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const title = post.title?.toLowerCase() || "";
      const excerpt = post.excerpt?.toLowerCase() || "";
      const category =
        typeof post.category === "object"
          ? post.category?.name?.toLowerCase() || ""
          : post.category?.toLowerCase?.() || "";

      const matchesSearch =
        title.includes(searchQuery.toLowerCase()) ||
        excerpt.includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [blogPosts, searchQuery, selectedCategory]);

  // 🌀 Loading Skeleton (Fixed version)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/50 to-white">
        <Header />

        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          {/* 🔍 Search + Filter Bar Skeleton */}
          <div className="relative top-4 z-40 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <Skeleton className="h-12 w-full md:flex-1 rounded-xl bg-gray-200" />
                <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-10 w-20 rounded-full bg-gray-200" />
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* 📚 Blog Grid Skeleton */}
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 px-4 sm:px-6 lg:px-8">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3"
                >
                  <Skeleton className="h-48 w-full rounded-lg bg-gray-200" />
                  <Skeleton className="h-6 w-3/4 rounded-md bg-gray-200" />
                  <Skeleton className="h-4 w-1/2 rounded-md bg-gray-200" />
                  <Skeleton className="h-4 w-5/6 rounded-md bg-gray-200" />
                  <Skeleton className="h-4 w-full rounded-md bg-gray-200" />
                </div>
              ))}
          </div>
        </div>

        {/* ✨ Background Glow */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200/40 via-transparent to-transparent blur-3xl" />
      </div>
    );
  }

  // 🫥 Empty state
  if (!blogPosts?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50">
        <Header />
        <p className="text-gray-500 text-lg">No blog posts found.</p>
      </div>
    );
  }

  // ✅ Main Content
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/50 to-white">
      <Header />

      {/* 🔍 Search + Filter */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative top-4 z-40 max-w-5xl mx-auto mb-12 px-6"
      >
        <div className="bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 text-sm transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-white shadow-md"
                      : "bg-white hover:bg-primary/10 text-gray-700"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 📚 Blog List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-semibold text-gray-800 mb-8 flex items-center"
        >
          <span className="h-8 w-1 rounded-full bg-primary mr-3" />
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post: BlogPost) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <BlogCard post={post} />
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-full">
              No articles match your search.
            </p>
          )}
        </motion.div>
      </div>

      {/* ✨ Background Glow */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200/40 via-transparent to-transparent blur-3xl" />
    </div>
  );
}